export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light':
      case 'selection':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(15);
        break;
      case 'heavy':
        navigator.vibrate([20, 10, 20]);
        break;
      case 'success':
        navigator.vibrate([10, 10, 20]);
        break;
      case 'warning':
        navigator.vibrate([20, 10, 40]);
        break;
      case 'error':
        navigator.vibrate([30, 20, 30, 20, 50]);
        break;
      default:
        navigator.vibrate(10);
    }
  }
}
