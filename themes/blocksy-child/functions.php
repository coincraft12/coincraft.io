<?php
/**
 * CoinCraft Blocksy Child Theme — functions.php
 */

// 부모 테마 스타일 로드
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'blocksy-parent-style',
        get_template_directory_uri() . '/style.css'
    );
    wp_enqueue_style(
        'blocksy-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        ['blocksy-parent-style']
    );

    // Pretendard (한국어 최적화 폰트)
    wp_enqueue_style(
        'coincraft-fonts',
        'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css',
        [],
        null
    );
});

// 기존 메뉴 위치 유지 (Eduma에서 사용하던 메뉴 슬롯 등록)
add_action('after_setup_theme', function () {
    register_nav_menus([
        'menu_1'      => '헤더 메뉴 1',
        'menu_2'      => '헤더 메뉴 2',
        'menu_mobile' => '모바일 메뉴',
        'footer'      => '푸터 메뉴',
    ]);
});
