// @flow

type Defer<R> = {
  promise: Promise<R>,
  resolve: (result: Promise<R> | R) => void,
  reject: (error: any) => void,
};

/**
 * Creates a defer object, which is useful to combine
 * Promises with nodelike callback interfaces
 */
export function defer(): Defer<*> {
  const deferred = {};

  // $FlowExpectedError: Not sure how to make this work, but it doesn't matter anyways
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}
