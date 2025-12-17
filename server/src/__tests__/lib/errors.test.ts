/**
 * Unit tests for Error Classes
 * Tests custom error types and properties
 */

import { describe, it, expect } from '@jest/globals';
import { AppError, NotFoundError, BadRequestError, InternalServerError } from '../../lib/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should allow setting isOperational to false', () => {
      const error = new AppError('Test error', 500, false);

      expect(error.isOperational).toBe(false);
    });

    it('should maintain instanceof check after instantiation', () => {
      const error = new AppError('Test error', 500);

      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default message', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create a NotFoundError with custom message', () => {
      const error = new NotFoundError('Custom not found message');

      expect(error.message).toBe('Custom not found message');
      expect(error.statusCode).toBe(404);
    });

    it('should maintain instanceof check', () => {
      const error = new NotFoundError();

      expect(error instanceof NotFoundError).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('BadRequestError', () => {
    it('should create a BadRequestError with default message', () => {
      const error = new BadRequestError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create a BadRequestError with custom message', () => {
      const error = new BadRequestError('Invalid input data');

      expect(error.message).toBe('Invalid input data');
      expect(error.statusCode).toBe(400);
    });

    it('should maintain instanceof check', () => {
      const error = new BadRequestError();

      expect(error instanceof BadRequestError).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('InternalServerError', () => {
    it('should create an InternalServerError with default message', () => {
      const error = new InternalServerError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create an InternalServerError with custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
    });

    it('should maintain instanceof check', () => {
      const error = new InternalServerError();

      expect(error instanceof InternalServerError).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error hierarchy', () => {
    it('should correctly identify error types in try-catch', () => {
      try {
        throw new NotFoundError('Test not found');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error).toBeInstanceOf(AppError);

        if (error instanceof AppError) {
          expect(error.statusCode).toBe(404);
          expect(error.isOperational).toBe(true);
        }
      }
    });

    it('should differentiate between error types', () => {
      const notFound = new NotFoundError();
      const badRequest = new BadRequestError();
      const serverError = new InternalServerError();

      expect(notFound instanceof NotFoundError).toBe(true);
      expect(notFound instanceof BadRequestError).toBe(false);
      expect(notFound instanceof InternalServerError).toBe(false);

      expect(badRequest instanceof BadRequestError).toBe(true);
      expect(badRequest instanceof NotFoundError).toBe(false);

      expect(serverError instanceof InternalServerError).toBe(true);
      expect(serverError instanceof NotFoundError).toBe(false);
    });
  });
});
