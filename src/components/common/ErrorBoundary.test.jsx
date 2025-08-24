import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// 会抛出错误的测试组件
const ThrowErrorComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('测试错误');
  }
  return <div>正常内容</div>;
};

// 测试错误边界组件
describe('ErrorBoundary', () => {
  // 在测试前模拟console.error以避免测试输出混乱
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  test('正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div data-testid="normal-content">正常内容</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('normal-content')).toBeInTheDocument();
  });

  test('捕获错误并显示降级UI', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // 应该显示错误页面
    expect(screen.getByText('哎呀，出错了！')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
    expect(screen.getByText('返回首页')).toBeInTheDocument();
  });

  test('使用自定义fallback', () => {
    const customFallback = <div data-testid="custom-fallback">自定义错误页面</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  test('重试功能', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // 点击重试按钮
    fireEvent.click(screen.getByText('重试'));

    // 重新渲染不抛出错误的组件
    rerender(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });
});

// 测试高阶组件
describe('withErrorBoundary', () => {
  test('包装组件提供错误保护', () => {
    const TestComponent = () => <div data-testid="test-component">测试组件</div>;
    const ProtectedComponent = withErrorBoundary(TestComponent);
    
    render(<ProtectedComponent />);
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});

// 测试Hook
describe('useErrorBoundary', () => {
  test('手动捕获错误', () => {
    const TestComponent = () => {
      const { error, handleError } = useErrorBoundary();
      
      if (error) {
        return <div data-testid="error-state">错误状态</div>;
      }
      
      return (
        <button 
          data-testid="trigger-error" 
          onClick={() => handleError(new Error('手动错误'))}
        >
          触发错误
        </button>
      );
    };
    
    render(<TestComponent />);
    
    // 点击按钮触发错误
    fireEvent.click(screen.getByTestId('trigger-error'));
    
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
  });
});