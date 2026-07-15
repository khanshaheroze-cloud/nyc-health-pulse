/* Jest environment shims — AsyncStorage has no native module under jest-expo;
 * use its official in-memory mock. */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
