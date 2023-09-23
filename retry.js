/*
 * credit: https://tusharf5.com/posts/retry-design-pattern-with-js-promises/
 */
function waitFor(millSeconds) {
  return new Promise((resolve, _) => {
    setTimeout(() => {
      resolve();
    }, millSeconds);
  });
}
/*
 * credit: https://tusharf5.com/posts/retry-design-pattern-with-js-promises/
 */

async function retryPromiseWithDelay(promise, nthTry, delayTime) {
  try {
    const res = await promise;
    return res;
  } catch (e) {
    if (nthTry === 1) {
      return Promise.reject(e);
    }
    console.log('retrying', nthTry, 'time');
    // wait for delayTime amount of time before calling this method again
    await waitFor(delayTime);
    return retryPromiseWithDelay(promise, nthTry - 1, delayTime);
  }
}
const retry = (promise) => retryPromiseWithDelay(promise, 3, 1000 * 30);
exports.retry = retry;
