const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  
  // Handle hundreds
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  // Handle tens and ones
  if (num >= 10) {
    if (num < 20) {
      result += teens[num - 10];
      return result;
    } else {
      result += tens[Math.floor(num / 10)];
      num %= 10;
      if (num > 0) {
        result += ' ' + ones[num];
      }
    }
  } else if (num > 0) {
    result += ones[num];
  }
  
  return result;
}

export function amountInWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees';
  
  // Handle negative numbers
  if (amount < 0) return 'Minus ' + amountInWords(-amount);
  
  // Split into rupees and paise
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = '';
  
  // Handle crores
  if (rupees >= 10000000) {
    const crores = Math.floor(rupees / 10000000);
    result += convertLessThanThousand(crores) + ' Crore ';
    amount = rupees % 10000000;
  } else {
    amount = rupees;
  }
  
  // Handle lakhs
  if (amount >= 100000) {
    const lakhs = Math.floor(amount / 100000);
    result += convertLessThanThousand(lakhs) + ' Lakh ';
    amount = amount % 100000;
  }
  
  // Handle thousands
  if (amount >= 1000) {
    const thousands = Math.floor(amount / 1000);
    result += convertLessThanThousand(thousands) + ' Thousand ';
    amount = amount % 1000;
  }
  
  // Handle remaining amount
  if (amount > 0) {
    result += convertLessThanThousand(amount);
  }
  
  result = result.trim() + ' Rupees';
  
  // Add paise if present
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }
  
  return result;
} 