import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ResponseFormat<T> {
  status: 'success';
  data: T;
}

export interface MessageResponseFormat<T> {
  status: 'success';
  message: string;
  data: T;
}

interface BaseResponseInterface {
  status: 'success' | 'error';
  message?: string;
  data?: unknown;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T> | MessageResponseFormat<T>>
{
  private isAlreadyWrapped(data: T): data is T & BaseResponseInterface {
    return (
      data !== null &&
      data !== undefined &&
      typeof data === 'object' &&
      'status' in data &&
      (data as BaseResponseInterface).status === 'success'
    );
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseFormat<T> | MessageResponseFormat<T>> {
    return next.handle().pipe(
      map((data: T) => {
        // If the response is already wrapped, return it as-is
        if (this.isAlreadyWrapped(data)) {
          return data as unknown as MessageResponseFormat<T>;
        }

        // Otherwise, wrap it with the basic response format
        return { status: 'success', data } as ResponseFormat<T>;
      }),
    );
  }
}
