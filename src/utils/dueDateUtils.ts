import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays } from "date-fns";

export interface DueDateInfo {
  text: string;
  color: string;
  bgColor: string;
  isUrgent: boolean;
}

export function getDueDateInfo(collectionDate: Date): DueDateInfo {
  const today = new Date();
  
  if (isToday(collectionDate)) {
    return {
      text: "Collection Today",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      isUrgent: true
    };
  }
  
  if (isTomorrow(collectionDate)) {
    return {
      text: "Collection Tomorrow",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      isUrgent: true
    };
  }
  
  if (isYesterday(collectionDate)) {
    return {
      text: "Collection Yesterday",
      color: "text-red-700",
      bgColor: "bg-red-100",
      isUrgent: true
    };
  }
  
  if (isPast(collectionDate)) {
    const daysOverdue = Math.abs(differenceInDays(today, collectionDate));
    return {
      text: `Collection ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago`,
      color: "text-red-800",
      bgColor: "bg-red-100",
      isUrgent: true
    };
  }
  
  const daysUntilCollection = differenceInDays(collectionDate, today);
  
  if (daysUntilCollection <= 3) {
    return {
      text: `Collection in ${daysUntilCollection} day${daysUntilCollection > 1 ? 's' : ''}`,
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      isUrgent: false
    };
  }
  
  if (daysUntilCollection <= 7) {
    return {
      text: `Collection in ${daysUntilCollection} days`,
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      isUrgent: false
    };
  }
  
  return {
    text: `Collection on ${format(collectionDate, "MMM dd")}`,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    isUrgent: false
  };
}