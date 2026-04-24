export const mockDatabaseService = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
  prepare: jest.fn(),
  transaction: jest.fn((fn: () => unknown) => fn()),
  close: jest.fn(),
};

export const resetDbMocks = () => {
  Object.values(mockDatabaseService).forEach((fn) => {
    if (typeof fn === 'function' && 'mockReset' in fn) {
      (fn as jest.Mock).mockReset();
    }
  });
  // Restore transaction default
  (mockDatabaseService.transaction as jest.Mock).mockImplementation(
    (fn: () => unknown) => fn(),
  );
};