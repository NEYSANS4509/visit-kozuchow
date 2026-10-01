// src/services/aiService.js
import { generateSystemPrompt, generateOfflineFallbackResponse } from '../data/aiKnowledge';

/**
 * Klucz dostępowy do Groq API.
 * UWAGA ZWIĄZANA Z BEZPIECZEŃSTWEM: W środowisku produkcyjnym klucz API nie powinien być
 * zaszyty w kodzie klienta. Zaleca się stosowanie zmiennych środowiskowych
 * (np. EXPO_PUBLIC_GROQ_API_KEY) lub bezpiecznego serwera proxy (Backend for Frontend).
 */
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

/**
 * Główny model językowy (Open Source Reasoning Model).
 * Wymaga parametru reasoning_effort: 'low', aby wewnętrzne tokeny myślenia
 * nie wyczerpywały limitu max_tokens, co wcześniej powodowało ucinanie odpowiedzi do pustego ciągu.
 */
const PRIMARY_MODEL = 'openai/gpt-oss-20b';

/**
 * Zapasowy model językowy (o wysokiej dostępności i zerowym narzucie reasoning tokens).
 * Uruchamiany automatycznie w przypadku niedostępności lub błędu modelu podstawowego.
 */
const FALLBACK_MODEL = 'qwen/qwen3.8-27b';

/**
 * Pomocnicza funkcja wysyłająca zapytanie do konkretnego modelu w infrastrukturze Groq API
 * z precyzyjnym limitem czasu (AbortController timeout).
 *
 * @param {string} model - Nazwa modelu na platformie Groq
 * @param {Array} messages - Tablica wiadomości (system, historia, user)
 * @param {object} options - Dodatkowe parametry wywołania modelu (np. reasoning_effort, max_tokens)
 * @param {number} timeoutMs - Limit czasu oczekiwania na odpowiedź w milisekundach
 * @returns {Promise<string|null>} Tekst odpowiedzi lub null w przypadku niepowodzenia
 */
async function callGroqModel(model, messages, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      model,
      messages,
      temperature: 0.5, // Umiarkowana kreatywność i wysoka precyzja faktograficzna
      max_tokens: 1200,  // Bezpieczny bufor tokenów zapobiegający przedwczesnemu ucięciu wypowiedzi
      ...options,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`Model Groq ${model} zwrócił status HTTP ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.warn(
        `Model ${model} zwrócił pustą treść (finish_reason: ${data.choices?.[0]?.finish_reason})`
      );
      return null;
    }

    return content;
  } catch (error) {
    clearTimeout(timer);
    console.warn(`Błąd wywołania modelu Groq (${model}):`, error.name === 'AbortError' ? 'Przekroczono limit czasu' : error.message);
    return null;
  }
}

/**
 * Wysyła zapytanie użytkownika do asystenta AI z wielopoziomowym systemem odporności na awarie (Resilience Architecture):
 * 1. Poziom 1: Podstawowy model 'openai/gpt-oss-20b' z kontrolowanym wysiłkiem myślenia (reasoning_effort: 'low')
 *    i zwiększonym buforem tokenów (max_tokens: 1200).
 * 2. Poziom 2: Zapasowy model 'qwen/qwen3.8-27b' o natychmiastowym czasie odpowiedzi bez zużycia tokenów reasoning.
 * 3. Poziom 3: Wbudowany lokalny silnik wiedzy offline (Offline Failsafe Engine), gdy urządzenie nie ma internetu
 *    lub API jest całkowicie niedostępne.
 *
 * @param {string} userText - Treść zapytania turysty
 * @param {Array} previousMessages - Dotychczasowa historia wiadomości w czacie
 * @param {object|null} userLocation - Współrzędne GPS użytkownika ({ latitude, longitude })
 * @returns {Promise<string>} Odpowiedź wygenerowana przez przewodnika AI
 */
export async function sendChatMessage(userText, previousMessages = [], userLocation = null) {
  if (!userText || !userText.trim()) return null;

  try {
    // Generowanie zoptymalizowanego promptu systemowego z bazą wiedzy oraz aktualnymi odległościami GPS
    const systemPrompt = generateSystemPrompt(userLocation);

    // Ograniczenie historii do ostatnich 4 wypowiedzi w celu ochrony budżetu tokenów i zachowania kontekstu
    const formattedHistory = (previousMessages || []).slice(-4).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userText },
    ];

    // 1. Próba wykonania zapytania przez główny model z niskim narzutem reasoning
    let answer = await callGroqModel(
      PRIMARY_MODEL,
      conversationMessages,
      { reasoning_effort: 'low', max_tokens: 1200 },
      8000
    );

    // 2. W przypadku niepowodzenia lub pustej treści — natychmiastowy fallback do modelu zapasowego
    if (!answer) {
      console.log(`Przełączanie na zapasowy model językowy: ${FALLBACK_MODEL}...`);
      answer = await callGroqModel(
        FALLBACK_MODEL,
        conversationMessages,
        { max_tokens: 1000 },
        6000
      );
    }

    // 3. Jeśli oba modele sieciowe zawiodły (np. brak sieci, limit API) — użycie lokalnej bazy wiedzy offline
    if (!answer) {
      console.log('Uruchamianie lokalnego silnika odpowiedzi awaryjnych (Offline Fallback Engine)...');
      answer = generateOfflineFallbackResponse(userText, userLocation);
    }

    return answer;
  } catch (error) {
    console.warn('Nieoczekiwany wyjątek w sendChatMessage, użycie awaryjnego silnika offline:', error);
    return generateOfflineFallbackResponse(userText, userLocation);
  }
}