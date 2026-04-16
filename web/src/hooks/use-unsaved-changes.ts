import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 저장되지 않은 변경사항이 있을 때 브라우저 닫기/탭 닫기/새로고침 경고.
 * isDirty가 true이면 beforeunload 이벤트를 등록한다.
 *
 * @param isDirty - 저장되지 않은 변경사항 여부
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /**
   * 페이지 이동 전 수동 확인. isDirty일 때 confirm을 띄우고 false면 이동 중단.
   * router.push 감싸서 사용:
   *   const go = confirmLeave(() => router.push('/some/path'));
   */
  const confirmLeave = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      const ok = window.confirm(
        '저장되지 않은 변경 사항이 있습니다.\n페이지를 벗어나면 변경 내용이 모두 사라집니다.'
      );
      if (ok) action();
    },
    [isDirty]
  );

  return { confirmLeave };
}
