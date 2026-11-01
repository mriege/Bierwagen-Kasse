import type { Drink, PfandType, State } from './types';
import { getInitialState } from './defaults';

export type Action =
  | { type: 'INCREMENT_ORDER'; drinkId: string; by?: number }
  | { type: 'DECREMENT_ORDER'; drinkId: string; by?: number }
  | { type: 'INCREMENT_RETURN'; pfandTypeId: string }
  | { type: 'DECREMENT_RETURN'; pfandTypeId: string }
  | { type: 'RESET_ORDER' }
  | { type: 'RESET_ALL' }
  | { type: 'ADD_DRINK'; drink: Drink }
  | { type: 'UPDATE_DRINK'; drink: Drink }
  | { type: 'DELETE_DRINK'; id: string }
  | { type: 'ADD_PFAND_TYPE'; pfandType: PfandType }
  | { type: 'UPDATE_PFAND_TYPE'; pfandType: PfandType }
  | { type: 'DELETE_PFAND_TYPE'; id: string }
  | { type: 'REPLACE_CONFIG'; drinks: Drink[]; pfandTypes: PfandType[] }
  /** Sortiment vom Sync-Partner: Die laufende Bestellung bleibt erhalten. */
  | { type: 'APPLY_SYNCED_CONFIG'; drinks: Drink[]; pfandTypes: PfandType[] }
  /** Stellt eine gerade abgeschlossene Bestellung wieder her (Rückgängig). */
  | { type: 'RESTORE_ORDER'; order: State['order']; returns: State['returns'] };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT_ORDER': {
      const by = action.by ?? 1;
      if (by <= 0) return state;
      const idx = state.order.findIndex((l) => l.drinkId === action.drinkId);
      if (idx >= 0) {
        const next = state.order.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + by };
        return { ...state, order: next };
      }
      return {
        ...state,
        order: [...state.order, { drinkId: action.drinkId, qty: by }],
      };
    }
    case 'DECREMENT_ORDER': {
      const by = action.by ?? 1;
      if (by <= 0) return state;
      return {
        ...state,
        order: state.order
          .map((l) => (l.drinkId === action.drinkId ? { ...l, qty: l.qty - by } : l))
          .filter((l) => l.qty > 0),
      };
    }

    case 'INCREMENT_RETURN': {
      const idx = state.returns.findIndex((l) => l.pfandTypeId === action.pfandTypeId);
      if (idx >= 0) {
        const next = state.returns.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return { ...state, returns: next };
      }
      return {
        ...state,
        returns: [...state.returns, { pfandTypeId: action.pfandTypeId, qty: 1 }],
      };
    }
    case 'DECREMENT_RETURN':
      return {
        ...state,
        returns: state.returns
          .map((l) => (l.pfandTypeId === action.pfandTypeId ? { ...l, qty: l.qty - 1 } : l))
          .filter((l) => l.qty > 0),
      };

    case 'RESET_ORDER':
      return { ...state, order: [], returns: [] };

    case 'RESET_ALL':
      return getInitialState();

    case 'ADD_DRINK':
      return { ...state, drinks: [...state.drinks, action.drink] };

    case 'UPDATE_DRINK':
      return {
        ...state,
        drinks: state.drinks.map((d) => (d.id === action.drink.id ? action.drink : d)),
      };

    case 'DELETE_DRINK':
      return {
        ...state,
        drinks: state.drinks.filter((d) => d.id !== action.id),
        order: state.order.filter((l) => l.drinkId !== action.id),
      };

    case 'ADD_PFAND_TYPE':
      return { ...state, pfandTypes: [...state.pfandTypes, action.pfandType] };

    case 'UPDATE_PFAND_TYPE':
      return {
        ...state,
        pfandTypes: state.pfandTypes.map((p) =>
          p.id === action.pfandType.id ? action.pfandType : p,
        ),
      };

    case 'DELETE_PFAND_TYPE':
      return {
        ...state,
        pfandTypes: state.pfandTypes.filter((p) => p.id !== action.id),
        drinks: state.drinks.map((d) =>
          d.pfandTypeId === action.id ? { ...d, pfandTypeId: null } : d,
        ),
        returns: state.returns.filter((l) => l.pfandTypeId !== action.id),
      };

    case 'REPLACE_CONFIG':
      return {
        drinks: action.drinks,
        pfandTypes: action.pfandTypes,
        order: [],
        returns: [],
      };

    case 'APPLY_SYNCED_CONFIG': {
      const drinkIds = new Set(action.drinks.map((d) => d.id));
      const pfandIds = new Set(action.pfandTypes.map((p) => p.id));
      return {
        drinks: action.drinks,
        pfandTypes: action.pfandTypes,
        order: state.order.filter((l) => drinkIds.has(l.drinkId)),
        returns: state.returns.filter((l) => pfandIds.has(l.pfandTypeId)),
      };
    }

    case 'RESTORE_ORDER': {
      // Das Sortiment kann sich seit dem Abschluss geändert haben.
      const drinkIds = new Set(state.drinks.map((d) => d.id));
      const pfandIds = new Set(state.pfandTypes.map((p) => p.id));
      return {
        ...state,
        order: action.order.filter((l) => drinkIds.has(l.drinkId)),
        returns: action.returns.filter((l) => pfandIds.has(l.pfandTypeId)),
      };
    }

    default:
      return state;
  }
}
