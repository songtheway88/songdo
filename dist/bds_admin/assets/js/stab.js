(function () {
  "use strict";

  function directChildren(el, selector) {
    return Array.prototype.filter.call(el ? el.children : [], function (child) {
      return !selector || child.matches(selector);
    });
  }

  function findContent(stab) {
    var id = stab.getAttribute("data-stab-id") || "stab";
    var explicit = null;
    document.querySelectorAll(".stab_content[data-stab-content]").forEach(function (node) {
      if (!explicit && node.getAttribute("data-stab-content") === id) explicit = node;
    });
    if (explicit) return explicit;
    var next = stab.nextElementSibling;
    if (next && next.classList.contains("stab_content")) return next;
    var current = stab;
    while (current && current.nextElementSibling) {
      current = current.nextElementSibling;
      if (current.classList && current.classList.contains("stab_content")) {
        return current;
      }
    }
    return null;
  }

  function hideAll(nodes) {
    nodes.forEach(function (node) {
      node.classList.add("hide");
      node.hidden = true;
    });
  }

  function show(node) {
    if (!node) return;
    node.classList.remove("hide");
    node.hidden = false;
  }

  function activateListItem(list, item) {
    if (!list || !item) return;
    list.querySelectorAll(":scope > li").forEach(function (li) {
      li.classList.toggle("active", li === item);
    });
  }

  function panelByKey(nodes, key) {
    if (!key) return null;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute("data-stab-key") === key) return nodes[i];
    }
    return null;
  }

  function queryKeyForStab(stabId) {
    if (!stabId || !window.location || !window.location.search) return "";
    try {
      return (new URLSearchParams(window.location.search).get(stabId) || "").trim();
    } catch (error) {
      return "";
    }
  }

  function updateQueryKeyForStab(stabId, key) {
    if (!stabId || !key || !window.location || !window.history || !window.history.replaceState) return;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(stabId, key);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (error) {
      return;
    }
  }

  function itemByKey(list, key) {
    if (!list || !key) return null;
    var items = list.querySelectorAll(":scope > li");
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute("data-stab-key") === key) return items[i];
    }
    return null;
  }

  function activeLabel(stab) {
    var active = stab.querySelector(".bds-stab-depth2 > li.active") || stab.querySelector(".bds-stab-depth1 > li.active") || stab.querySelector(".bds-stab-depth1 > li");
    if (!active) return "";
    var control = active.querySelector("a, button");
    return control ? control.textContent.trim() : active.textContent.trim();
  }

  function updateDropdownLabel(stab) {
    var label = stab.querySelector(".bds-stab-dropdown-label");
    if (label) label.textContent = activeLabel(stab);
  }

  function closeDropdown(stab) {
    var toggle = stab.querySelector(".bds-stab-dropdown-toggle");
    stab.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function initDropdownStab(stab) {
    var toggle = stab.querySelector(".bds-stab-dropdown-toggle");
    if (!toggle) return;
    updateDropdownLabel(stab);
    toggle.addEventListener("click", function () {
      var open = !stab.classList.contains("is-open");
      document.querySelectorAll(".bds-stab-theme-dropdown.is-open").forEach(function (other) {
        if (other !== stab) closeDropdown(other);
      });
      stab.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    stab.addEventListener("click", function (event) {
      var itemControl = event.target.closest(".bds-stab-dropdown-menu a, .bds-stab-dropdown-menu button");
      if (!itemControl || !stab.contains(itemControl)) return;
      window.setTimeout(function () {
        updateDropdownLabel(stab);
        closeDropdown(stab);
      }, 0);
    });
  }

  function initContentStab(stab) {
    var content = findContent(stab);
    if (!content) return;
    var stabId = stab.getAttribute("data-stab-id") || "stab";
    var queryKey = queryKeyForStab(stabId);
    var mode = stab.getAttribute("data-content-mode") || "single";
    var depth1 = stab.querySelector(".bds-stab-depth1");

    function depth2For(parentIndex) {
      var lists = Array.prototype.slice.call(stab.querySelectorAll(".bds-stab-depth2"));
      if (!lists.length) return null;
      for (var i = 0; i < lists.length; i++) {
        if (parseInt(lists[i].getAttribute("data-stab-depth2-parent") || "0", 10) === parentIndex) {
          return lists[i];
        }
      }
      return lists[0];
    }

    function showDepth2(list) {
      stab.querySelectorAll(".bds-stab-depth2").forEach(function (ul) {
        ul.hidden = ul !== list;
      });
    }

    function setSingle(parentLi, syncUrl) {
      var parentIndex = parseInt(parentLi.getAttribute("data-stab-parent-index") || "0", 10);
      var panels = directChildren(content);
      var target = panelByKey(panels, parentLi.getAttribute("data-stab-key")) || panels[parentIndex];
      hideAll(panels);
      show(target);
      activateListItem(depth1, parentLi);
      if (syncUrl) updateQueryKeyForStab(stabId, parentLi.getAttribute("data-stab-key") || "");
    }

    function setTwoLevel(parentLi, childLi, syncUrl) {
      var parentIndex = parseInt(parentLi.getAttribute("data-stab-parent-index") || "0", 10);
      var childIndex = parseInt((childLi && childLi.getAttribute("data-stab-child-index")) || "0", 10);
      var depth2 = depth2For(parentIndex);
      showDepth2(depth2);
      if (!childLi && depth2) childLi = depth2.querySelector(":scope > li");
      var groups = directChildren(content, ".stab_content_group");
      var group = panelByKey(groups, parentLi.getAttribute("data-stab-key")) || groups[parentIndex];
      hideAll(groups);
      show(group);
      if (!group) return;
      var panels = directChildren(group);
      var target = childLi ? panelByKey(panels, childLi.getAttribute("data-stab-key")) : null;
      target = target || panels[childIndex];
      hideAll(panels);
      show(target);
      activateListItem(depth1, parentLi);
      if (depth2) activateListItem(depth2, childLi || depth2.querySelector(":scope > li"));
      if (syncUrl) updateQueryKeyForStab(stabId, (childLi && childLi.getAttribute("data-stab-key")) || parentLi.getAttribute("data-stab-key") || "");
    }

    if (mode === "two-level") {
      var activeParent = depth1 ? itemByKey(depth1, queryKey) || depth1.querySelector(":scope > li.active") || depth1.querySelector(":scope > li") : null;
      var activeParentIndex = activeParent ? parseInt(activeParent.getAttribute("data-stab-parent-index") || "0", 10) : 0;
      var activeDepth2 = depth2For(activeParentIndex);
      var activeChild = activeDepth2 ? itemByKey(activeDepth2, queryKey) || activeDepth2.querySelector(":scope > li.active") || activeDepth2.querySelector(":scope > li") : null;
      if (!itemByKey(depth1, queryKey) && !itemByKey(activeDepth2, queryKey)) {
        var depth2Lists = Array.prototype.slice.call(stab.querySelectorAll(".bds-stab-depth2"));
        for (var i = 0; i < depth2Lists.length; i++) {
          var matchedChild = itemByKey(depth2Lists[i], queryKey);
          if (matchedChild) {
            activeParentIndex = parseInt(depth2Lists[i].getAttribute("data-stab-depth2-parent") || "0", 10);
            activeParent = depth1 ? depth1.querySelector('[data-stab-parent-index="' + activeParentIndex + '"]') : activeParent;
            activeDepth2 = depth2Lists[i];
            activeChild = matchedChild;
            break;
          }
        }
      }
      if (activeParent) setTwoLevel(activeParent, activeChild, false);
    } else if (depth1) {
      var active = itemByKey(depth1, queryKey) || depth1.querySelector(":scope > li.active") || depth1.querySelector(":scope > li");
      if (active) setSingle(active, false);
    }

    stab.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button || !stab.contains(button)) return;
      var li = button.closest("li");
      if (!li) return;
      if (li.hasAttribute("data-stab-parent-index")) {
        if (mode === "two-level") {
          setTwoLevel(li, null, true);
        } else {
          setSingle(li, true);
        }
      } else if (li.hasAttribute("data-stab-child-index") && mode === "two-level") {
        var parent = depth1 ? depth1.querySelector(":scope > li.active") || depth1.querySelector(":scope > li") : null;
        if (parent) setTwoLevel(parent, li, true);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".bds-stab-theme-dropdown").forEach(initDropdownStab);
    document.querySelectorAll(".bds-stab[data-stab-type='content'], .bds-stab[data-stab-type='two_level_content']").forEach(initContentStab);
  });

  document.addEventListener("click", function (event) {
    document.querySelectorAll(".bds-stab-theme-dropdown.is-open").forEach(function (stab) {
      if (!stab.contains(event.target)) closeDropdown(stab);
    });
  });

  window.BDS_STAB_TESTS = window.BDS_STAB_TESTS || {};
  window.BDS_STAB_TESTS.queryKeyForStab = queryKeyForStab;
  window.BDS_STAB_TESTS.updateQueryKeyForStab = updateQueryKeyForStab;
  window.BDS_STAB_TESTS.initDropdownStab = initDropdownStab;
})();
