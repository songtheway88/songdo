(function () {
  var popupVisible = false;
  var fallbackDuration = 30;

  function expiresAtMidnight() {
    var d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.toUTCString();
  }

  function setCookie(name, value) {
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expiresAtMidnight() + "; path=/; SameSite=Lax";
  }

  function isMobilePopup(wrap) {
    return (wrap && wrap.classList.contains("is-device-mobile")) || window.matchMedia("(max-width: 640px)").matches;
  }

  function getItems(wrap) {
    return Array.prototype.slice.call(wrap.querySelectorAll(".site-popup-item"));
  }

  function getCurrentMobileItem(wrap) {
    return wrap.querySelector(".site-popup-item.is-current") || getItems(wrap).filter(function (item) {
      return !item.classList.contains("is-hidden");
    })[0] || null;
  }

  function rememberAllItems(wrap) {
    if (wrap.hasAttribute("data-popup-preview")) {
      return;
    }
    var ids = (wrap.getAttribute("data-popup-ids") || "").split(",");
    ids.forEach(function (id) {
      id = id.trim();
      if (id) {
        setCookie("popup_closed_" + id, "1");
      }
    });
  }

  function parseTimeValue(value) {
    value = String(value || "").trim();
    if (!value) return 0;
    if (value.slice(-2) === "ms") return parseFloat(value) || 0;
    if (value.slice(-1) === "s") return (parseFloat(value) || 0) * 1000;
    return parseFloat(value) || 0;
  }

  function maxCssDuration(value) {
    return String(value || "").split(",").reduce(function (max, part) {
      return Math.max(max, parseTimeValue(part));
    }, 0);
  }

  function transitionDuration(target, customProperty) {
    if (!target || !window.getComputedStyle) return fallbackDuration;
    var styles = window.getComputedStyle(target);
    var custom = customProperty ? parseTimeValue(styles.getPropertyValue(customProperty)) : 0;
    var animation = maxCssDuration(styles.animationDuration) + maxCssDuration(styles.animationDelay);
    var transition = maxCssDuration(styles.transitionDuration) + maxCssDuration(styles.transitionDelay);
    return Math.max(custom, animation, transition, fallbackDuration);
  }

  function nextMotionToken(target) {
    if (!target) return "";
    var token = String(Date.now()) + "-" + String(Math.random()).slice(2);
    target.setAttribute("data-popup-motion-token", token);
    return token;
  }

  function afterMotion(target, customProperty, token, callback) {
    var done = false;
    var duration = transitionDuration(target, customProperty);
    var timer = window.setTimeout(finish, duration + 60);

    function finish(event) {
      if (event && event.target !== target) {
        return;
      }
      if (done) return;
      if (target && token && target.getAttribute("data-popup-motion-token") !== token) {
        return;
      }
      done = true;
      window.clearTimeout(timer);
      if (target) {
        target.removeEventListener("animationend", finish);
        target.removeEventListener("transitionend", finish);
      }
      callback();
    }

    if (!target) {
      finish();
      return;
    }
    target.addEventListener("animationend", finish);
    target.addEventListener("transitionend", finish);
  }

  function showWrap(wrap) {
    if (!wrap) return;
    var target = wrap.querySelector(".site-popup") || wrap;
    var token = nextMotionToken(target);
    wrap.hidden = false;
    wrap.style.display = "";
    wrap.classList.remove("is-hidden", "is-closing");
    wrap.classList.add("is-opening");
    window.requestAnimationFrame(function () {
      wrap.classList.add("is-open");
      afterMotion(target, "--popup-open-duration", token, function () {
        wrap.classList.remove("is-opening");
      });
    });
  }

  function hideWrap(wrap) {
    if (!wrap) return;
    var target = wrap.querySelector(".site-popup") || wrap;
    var token = nextMotionToken(target);
    wrap.classList.remove("is-opening", "is-open");
    wrap.classList.add("is-closing");
    afterMotion(target, "--popup-close-duration", token, function () {
      wrap.classList.remove("is-closing");
      wrap.classList.add("is-hidden");
      wrap.hidden = true;
    });
  }

  function showItem(item) {
    if (!item) return;
    var token = nextMotionToken(item);
    item.hidden = false;
    item.classList.remove("is-hidden", "is-leaving");
    item.classList.add("is-current", "is-entering");
    window.requestAnimationFrame(function () {
      afterMotion(item, "--popup-item-open-duration", token, function () {
        item.classList.remove("is-entering");
      });
    });
  }

  function hideItem(item, callback) {
    if (!item) {
      callback();
      return;
    }
    var token = nextMotionToken(item);
    item.classList.remove("is-entering");
    item.classList.add("is-leaving");
    afterMotion(item, "--popup-item-close-duration", token, function () {
      item.classList.remove("is-current", "is-leaving");
      item.classList.add("is-hidden");
      item.hidden = true;
      callback();
    });
  }

  function resetMobileItems(wrap) {
    var items = getItems(wrap);
    items.forEach(function (item, index) {
      item.classList.remove("is-entering", "is-leaving");
      item.classList.toggle("is-current", index === 0);
      item.classList.toggle("is-hidden", index !== 0);
      item.hidden = index !== 0;
    });
  }

  function closeMobileWrap(wrap, todayClose) {
    if (todayClose) {
      getItems(wrap).forEach(function (item) {
        item.classList.remove("is-current", "is-entering", "is-leaving");
        item.classList.add("is-hidden");
        item.hidden = true;
      });
      hideWrap(wrap);
      return;
    }

    var items = getItems(wrap);
    var current = getCurrentMobileItem(wrap);
    var index = items.indexOf(current);
    var next = items[index + 1] || null;

    if (!current || !next) {
      hideItem(current, function () {
        hideWrap(wrap);
      });
      return;
    }

    hideItem(current, function () {
      showItem(next);
      var checkbox = wrap.querySelector(".js-popup-today-close");
      if (checkbox) {
        checkbox.checked = false;
      }
    });
  }

  function closePopup(options) {
    options = options || {};
    var todayClose = options.todayClose === true;

    document.querySelectorAll("[data-popup-wrap]").forEach(function (wrap) {
      if (!wrap || wrap.classList.contains("is-closing")) return;

      if (todayClose) {
        rememberAllItems(wrap);
      }

      if (isMobilePopup(wrap)) {
        closeMobileWrap(wrap, todayClose);
      } else {
        hideWrap(wrap);
      }
    });

    popupVisible = false;
  }

  function openPopup(options) {
    options = options || {};
    var force = options.force === true;
    var wraps = document.querySelectorAll("[data-popup-wrap]");
    var opened = false;

    wraps.forEach(function (wrap) {
      if (wrap.hasAttribute("data-popup-preview")) {
        return;
      }
      var delayAttr = wrap.getAttribute("data-popup-delay");
      if (delayAttr === "0" && !force) {
        return;
      }
      var delay = parseInt(delayAttr, 10);
      if (!force && delay && delay > 0) {
        opened = true;
        window.setTimeout(function () {
          if (isMobilePopup(wrap)) resetMobileItems(wrap);
          showWrap(wrap);
          wrap.removeAttribute("data-popup-delay");
        }, delay);
      } else {
        if (isMobilePopup(wrap)) resetMobileItems(wrap);
        showWrap(wrap);
        if (force) {
          wrap.removeAttribute("data-popup-delay");
        }
        opened = true;
      }
    });

    popupVisible = opened;
  }

  function setupMobileItems() {
    document.querySelectorAll("[data-popup-wrap]").forEach(function (wrap) {
      var items = getItems(wrap);
      if (!items.length) {
        return;
      }
      if (!isMobilePopup(wrap)) {
        items.forEach(function (item) {
          item.hidden = false;
          item.classList.remove("is-current", "is-entering", "is-leaving", "is-hidden");
        });
        return;
      }
      var currentExists = items.some(function (item) {
        return item.classList.contains("is-current") && !item.classList.contains("is-hidden");
      });
      items.forEach(function (item, index) {
        var active = currentExists ? item.classList.contains("is-current") && !item.classList.contains("is-hidden") : index === 0;
        item.hidden = !active;
        item.classList.toggle("is-current", active);
        item.classList.toggle("is-hidden", !active);
        item.classList.remove("is-entering", "is-leaving");
      });
    });
  }

  window.popup_toggle = function () {
    if (popupVisible) {
      closePopup({ todayClose: false });
    } else {
      openPopup({ force: true });
    }
  };

  window.PopupCore = {
    open: openPopup,
    close: closePopup,
    setupMobileItems: setupMobileItems,
    showWrap: showWrap,
    hideWrap: hideWrap
  };

  openPopup();
  window.addEventListener("resize", setupMobileItems);

  document.addEventListener("click", function (event) {
    var alertButton = event.target.closest("[data-popup-alert]");
    if (alertButton) {
      event.preventDefault();
      alert(alertButton.getAttribute("data-popup-alert") || "준비중입니다.");
      return;
    }
    var button = event.target.closest(".js-popup-close");
    if (!button) {
      return;
    }
    var wrap = button.closest("[data-popup-wrap]");
    var rememberToday = wrap && Array.prototype.some.call(wrap.querySelectorAll(".js-popup-today-close"), function (input) {
      return input.checked;
    });
    closePopup({ todayClose: rememberToday });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && popupVisible) {
      closePopup({ todayClose: false });
    }
  });
})();
