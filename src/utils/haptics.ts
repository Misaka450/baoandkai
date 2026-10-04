export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' = 'light') {
  if (typeof window === 'undefined' || !navigator || !('vibrate' in navigator)) return
  try {
    switch (type) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(20); break;
      case 'heavy': navigator.vibrate(40); break;
      case 'success': navigator.vibrate([10, 50, 20]); break;
    }
  } catch {}
}
