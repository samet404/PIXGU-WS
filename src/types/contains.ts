/**
 * Type that represents an object with all properties of type `T`
 * 
 * @example
 *let notInvalid: Contains<{
 *   banana: false;
 *   apple: 3;
 * }, {
 *  banana: false;
 *  apple: 3;
 *  hello: 'world';
 * }>  // Error
 */
export type Contains<T, U> = {
    [K in keyof U]: K extends keyof T
    ? U[K] extends T[K]
    ? U[K]
    : never
    : never;
} extends U
    ? keyof U extends keyof T
    ? U
    : never
    : never;
