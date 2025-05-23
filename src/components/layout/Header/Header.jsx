// src/components/common/Header/Header.jsx
import { h } from 'preact';
import { Button } from '@/components/common/Button/Button'; // Button 컴포넌트 임포트

/**
 * @typedef User
 * @property {string} name - 사용자 이름
 * @property {string} [avatarUrl] - 사용자 아바타 이미지 URL
 */

/**
 * @param {object} props
 * @param {string} [props.logoUrl='/'] - 로고 클릭 시 이동할 URL
 * @param {string} [props.logoSrc='/favicon.svg'] - 로고 이미지 소스
 * @param {string} [props.logoAlt='로고'] - 로고 이미지 alt 텍스트
 * @param {function} [props.onSearchSubmit] - 검색어 제출 시 호출될 함수 (검색어 전달)
 * @param {string} [props.searchPlaceholder='검색어를 입력하세요...'] - 검색창 placeholder
 * @param {User} [props.user] - 현재 로그인한 사용자 정보
 * @param {function} [props.onLogin] - 로그인 버튼 클릭 시 호출될 함수
 * @param {function} [props.onLogout] - 로그아웃 버튼 클릭 시 호출될 함수
 * @param {function} [props.onNotificationClick] - 알림 아이콘 클릭 시 호출될 함수
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @returns {import("preact").JSX.Element} Header 컴포넌트
 */
export function Header({
  logoUrl = '/',
  logoSrc = '/favicon.svg', // public 디렉토리 기준
  logoAlt = '로고',
  onSearchSubmit,
  searchPlaceholder = '검색어를 입력하세요...',
  user,
  onLogin,
  onLogout,
  onNotificationClick,
  className = '',
  ...restProps
}) {
  const handleSearch = (event) => {
    event.preventDefault();
    const searchTerm = event.target.elements.search.value;
    if (onSearchSubmit && searchTerm.trim()) {
      onSearchSubmit(searchTerm.trim());
    }
  };

  return (
    <header class={`header ${className}`.trim()} role="banner" {...restProps}>
      <a href={logoUrl} class="header__logo-link">
        <img src={logoSrc} alt={logoAlt} class="header__logo-img" style={{ height: '2.5rem' }} /> {/* 예시 로고 스타일 */}
      </a>

      {onSearchSubmit && (
        <div class="header__search-wrap">
          <form class="header__search-bar" onSubmit={handleSearch}>
            <input type="search" name="search" class="header__search-input" placeholder={searchPlaceholder} aria-label="검색" />
            <Button type="info" size="small" htmlType="submit" ariaLabel="검색 실행" class="button--round">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </Button>
          </form>
        </div>
      )}

      <div class="header__user">
        {user ? (
          <div class="header__user-wrap">
            {onNotificationClick && (
              <Button type="icon" onClick={onNotificationClick} ariaLabel="알림">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              </Button>
            )}
            <span>{user.name}님</span>
            {onLogout && <Button type="text" onClick={onLogout}>로그아웃</Button>}
          </div>
        ) : (
          onLogin && <Button type="primary" onClick={onLogin}>로그인</Button>
        )}
      </div>
    </header>
  );
}