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
      text: "Due Today",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      isUrgent: true
    };
  }
  
  if (isTomorrow(collectionDate)) {
    return {
      text: "Due Tomorrow",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      isUrgent: true
    };
  }
  
  if (isYesterday(collectionDate)) {
    return {
      text: "Due Yesterday",
      color: "text-red-700",
      bgColor: "bg-red-100",
      isUrgent: true
    };
  }
  
  if (isPast(collectionDate)) {
    const daysOverdue = Math.abs(differenceInDays(today, collectionDate));
    return {
      text: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
      color: "text-red-800",
      bgColor: "bg-red-100",
      isUrgent: true
    };
  }
  
  const daysUntilDue = differenceInDays(collectionDate, today);
  
  if (daysUntilDue <= 3) {
    return {
      text: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      isUrgent: false
    };
  }
  
  if (daysUntilDue <= 7) {
    return {
      text: `Due in ${daysUntilDue} days`,
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      isUrgent: false
    };
  }
  
  return {
    text: format(collectionDate, "MMM dd"),
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    isUrgent: false
  };
}