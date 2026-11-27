(function () {
  var KEY = 'dabanshu-lang';
  function current() {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh';
  }
  function apply(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
    var attr = lang === 'en' ? 'data-en' : 'data-zh';
    var nodes = document.querySelectorAll('[data-zh]');
    for (var i = 0; i < nodes.length; i++) {
      var text = nodes[i].getAttribute(attr);
      if (text != null) nodes[i].textContent = text;
    }
    var buttons = document.querySelectorAll('[data-lang-switch]');
    for (var j = 0; j < buttons.length; j++) {
      var on = buttons[j].getAttribute('data-lang-switch') === lang;
      buttons[j].classList.toggle('on', on);
      buttons[j].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  document.addEventListener('click', function (e) {
    var button = e.target.closest ? e.target.closest('[data-lang-switch]') : null;
    if (!button) return;
    var lang = button.getAttribute('data-lang-switch');
    localStorage.setItem(KEY, lang);
    apply(lang);
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(current()); });
  } else {
    apply(current());
  }
})();
