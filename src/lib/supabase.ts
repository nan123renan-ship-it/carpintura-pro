import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL)
  || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL)
  || '';

const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY)
  || '';

// Se não houver credenciais, criar um cliente mock que não faz nada
// Isso permite o app funcionar sem Supabase usando apenas localStorage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function criarClienteMock(): any {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'auth') {
        return new Proxy({}, {
          get(_t, authProp) {
            if (authProp === 'getUser') return async () => ({ data: { user: null }, error: null });
            if (authProp === 'getSession') return async () => ({ data: { session: null }, error: null });
            if (authProp === 'onAuthStateChange') return (_event: any, _cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } });
            if (authProp === 'signIn' || authProp === 'signInWithPassword') return async () => ({ data: null, error: { message: 'Supabase não configurado' } });
            if (authProp === 'signOut') return async () => ({ error: null });
            return async () => ({ data: null, error: { message: 'Supabase não configurado' } });
          }
        });
      }
      // Para from(), channel(), etc. retornar proxy encadeável
      return new Proxy(() => {}, {
        apply() {
          return new Proxy({}, handler);
        },
        get(_t, innerProp) {
          if (innerProp === 'select' || innerProp === 'insert' || innerProp === 'update' ||
              innerProp === 'delete' || innerProp === 'upsert' || innerProp === 'eq' ||
              innerProp === 'order' || innerProp === 'limit' || innerProp === 'single' ||
              innerProp === 'on' || innerProp === 'subscribe') {
            return (..._args: any[]) => new Proxy({}, handler);
          }
          if (innerProp === 'then') return undefined; // não é uma Promise
          return new Proxy(() => {}, { apply: () => ({ data: null, error: null, count: 0 }), get: () => async () => ({ data: null, error: null }) });
        }
      });
    }
  };
  return new Proxy({}, handler);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'carpintura-auth',
      flowType: 'implicit'
    }
  });
} else {
  supabase = criarClienteMock();
}

export { supabase };
export const supabaseConfigurado = !!(supabaseUrl && supabaseAnonKey);
