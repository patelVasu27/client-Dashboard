export function debounce(fn, delay = 400) {
  let timerId = null;

  const debounced = (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };

  debounced.cancel = () => {
    clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}
