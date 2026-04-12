<?php
/**
 * CoinCraft Child Theme — footer.php
 * 기존 Eduma thim_ekit 푸터 내용을 그대로 유지
 */
?>
</div><!-- #content -->

<footer id="cc-footer">
    <?php
    // 기존 Eduma Footer (thim_ekit ID: 15316) — 연락처, SNS, 링크
    if ( shortcode_exists('thim_ekit') ) {
        echo do_shortcode('[thim_ekit id="15316"]');
    }
    ?>
    <div id="cc-footer-bottom">
    <?php
    // 기존 Footer Bottom (thim_ekit ID: 15320) — 카피라이트
    if ( shortcode_exists('thim_ekit') ) {
        echo do_shortcode('[thim_ekit id="15320"]');
    }
    ?>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
