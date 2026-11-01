import type { Drink, HappyHour } from './types';

export const isHappyHourActive = (hh: HappyHour, nowMinutes: number): boolean => {
  if (hh.startMinutes === hh.endMinutes) return false;
  if (hh.startMinutes < hh.endMinutes) {
    return nowMinutes >= hh.startMinutes && nowMinutes < hh.endMinutes;
  }
  return nowMinutes >= hh.startMinutes || nowMinutes < hh.endMinutes;
};

export const effectivePriceCents = (drink: Drink, nowMinutes: number): number => {
  if (drink.happyHour && isHappyHourActive(drink.happyHour, nowMinutes)) {
    return drink.happyHour.priceCents;
  }
  return drink.priceCents;
};

export const isDrinkOnHappyHour = (drink: Drink, nowMinutes: number): boolean =>
  Boolean(drink.happyHour && isHappyHourActive(drink.happyHour, nowMinutes));
