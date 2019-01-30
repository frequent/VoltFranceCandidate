/*jslint nomen: true, indent: 2, maxlen: 80 */
/*global window, rJS, RSVP, Math */
(function (window, rJS, RSVP, Math) {
    "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var STR = "";
  var ACTIVE = "is-active";
  var KLASS = rJS(window);
  var CANVAS = "canvas";
  var ARR = [];
  var BLANK = "_blank";
  var NAME = "name";
  var VOLT = "volt_jio";
  var LOCATION = window.location;
  var DOCUMENT = window.document;
  var INTERSECTION_OBSERVER = window.IntersectionObserver;
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var POPPER = "width=600,height=480,resizable=yes,scrollbars=yes,status=yes";
  var LANG = "https://raw.githubusercontent.com/VoltEuropa/VoltFranceCandidate/master/lang/";
  var SOCIAL_MEDIA_CONFIG = {
    "facebook": "https://www.facebook.com/sharer.php?u={url}",
    "twitter": "https://twitter.com/intent/tweet?url={url}&text={text}&hashtags={tag_list}"
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  // poor man's templates. thx, http://javascript.crockford.com/remedial.html
  if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
      return this.replace(TEMPLATE_PARSER, function (a, b) {
        var r = o[b];
        return typeof r === "string" || typeof r === "number" ? r : a;
      });
    };
  }

  function getTemplate(my_klass, my_id) {
    return my_klass.__template_element.getElementById(my_id).innerHTML;
  }

  function purgeDom(my_node) {
    while (my_node.firstChild) {
      my_node.removeChild(my_node.firstChild);
    }
  }

  function setDom(my_node, my_string, my_purge) {
    var faux_element = DOCUMENT.createElement(CANVAS);
    if (my_purge) {
      purgeDom(my_node);
    }
    faux_element.innerHTML = my_string;
    ARR.slice.call(faux_element.children).forEach(function (element) {
      my_node.appendChild(element);
    });
  }

  function getLang(nav) {
    return (nav.languages ? nav.languages[0] : (nav.language || nav.userLanguage));
  }

  function getConfig(my_language) {
    return {
      "type": "volt_storage",
      "repo": "VoltFranceCandidate",
      "path": "lang/" + my_language,
      "__debug": "https://softinst103163.host.vifib.net/candid/lang/" + my_language + "/debug.json"
    };
  }

  KLASS

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "locale": getLang(window.navigator).substring(0, 2) || "en",
      "online": null,
      "sw_errors": 0
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var element = gadget.element;
      gadget.property_dict = {

        // yaya, should be localstorage caling repair to sync
        "url_dict": {},
        "content_dict": {},
        "i18n_dict": {}
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("translateDom", "translateDom")

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // ---------------------- JIO bridge ---------------------------------------
    .declareMethod("route", function (my_scope, my_call, my_p1, my_p2, my_p3) {
      return this.getDeclaredGadget(my_scope)
        .push(function (my_gadget) {
          return my_gadget[my_call](my_p1, my_p2, my_p3);
        });
    })
    .declareMethod("volt_create", function (my_option_dict) {
      return this.route(VOLT, "createJIO", my_option_dict);
    })
    .declareMethod("volt_get", function (my_id) {
      return this.route(VOLT, "get", my_id);
    })
    .declareMethod("volt_allDocs", function () {
      return this.route(VOLT, "allDocs");
    })

    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
  
      if (delta.hasOwnProperty("locale")) {
        state.locale = delta.locale;
      }
      if (delta.hasOwnProperty("online")) {
        state.online = delta.online;
        if (state.online) {
          gadget.element.classList.remove("volt-offline");
        } else {
          gadget.element.classList.add("volt-offline");
        }
      }
      return;
    })

    // thx: https://css-tricks.com/simple-social-sharing-links/
    // twitter prevalidate url: https://cards-dev.twitter.com/validator
    // https://developers.facebook.com/docs/sharing/best-practices/
    .declareMethod("shareUrl", function (my_scm) {
      var popup;
      var is_mobile = window.matchMedia("only screen and (max-width: 48em)");
      var popup_resolver;

      // lots of bells and whistles for trying to stay on the page, use this
      // with localstorage is we want to keep state or login on social media
      var resolver = new Promise(function (resolve, reject) {
        popup_resolver = function resolver(href) {
          return resolve({});
        };
      });

      popup = window.open(
        SOCIAL_MEDIA_CONFIG[my_scm].supplant({
          "url": window.encodeURIComponent(LOCATION.href),
          "text":"",
          "tag_list": "VoteVolt,CandadatCitoyenne"
        }),
        is_mobile.matches ? BLANK : STR,
        is_mobile.matches ? null : POPPER
      );
      popup.opener.popup_resolver = popup_resolver;
      return window.promiseEventListener(popup, "load", true);
    })

    .declareMethod("fetchTranslationAndUpdateDom", function (my_language) {
      var gadget = this;
      var dict = gadget.property_dict;
      var url_dict = dict.url_dict;
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_get(url_dict.ui);
        })
        .push(function (data) {
          dict.i18n_dict = data;
          return gadget.translateDom(data);
        });
    })

    .declareMethod("updateStorage", function (my_language) {
      var gadget = this;
      if (my_language === gadget.state.locale) {
        return;
      }
      return new RSVP.Queue()
        .push(function () {
          return gadget.stateChange({"locale": my_language});
        })
        .push(function () {
          return gadget.volt_create(getConfig(my_language));
        })
        .push(function () {
          return gadget.buildCalendarLookupDict();
        })
        .push(function () {
          return gadget.fetchTranslationAndUpdateDom();
        });
    })

    .declareMethod("buildCalendarLookupDict", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_allDocs();
        })
        .push(function (my_file_list) {
          if (my_file_list.data.total_rows === 0) {
            return gadget.updateStorage("en");
          }
          my_file_list.data.rows.map(function (row) {
            dict.url_dict[row.id.split("/").pop().replace(".json", "")] = row.id;
          });
        })

        // we only need a language to build the dict, so in case of errors like
        // on OS X/Safari 9, which cannot handle Github APIv3 redirect, we just
        // build the damn thing by hand... and fail somewhere else
        .push(undefined, function(whatever) {
          var i;
          for (i = 1; i < 32; i += 1) {
            dict.url_dict[i] = LANG + gadget.state.locale + "/" + i + ".json";
          }
          dict.url_dict["ui"] = LANG + gadget.state.locale + "/ui.json";
        });
    })

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;

      window.componentHandler.upgradeDom();
      mergeDict(dict, my_option_dict);
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_create(getConfig(gadget.state.locale));
        })
        .push(function () {
          return gadget.buildCalendarLookupDict();
        })
        .push(function () {
          return gadget.fetchTranslationAndUpdateDom(gadget.state.locale);
        });
    })


    /////////////////////////////
    // declared jobs
    /////////////////////////////

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var body = DOCUMENT.body;
      var seo = body.querySelector(".volt-seo-content");
      seo.parentElement.removeChild(seo);
      body.classList.remove("volt-splash");     
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var gadget = this;
      var listener = window.loopEventListener;

      function handleConnection() {
        return gadget.stateChange({"online": window.navigator.onLine});
      }
      return RSVP.all([
        //gadget.installServiceWorker(),
        listener(window, "online", false, handleConnection),
        listener(window, "offline", false, handleConnection),
      ]);
    })

    /////////////////////////////
    // on Event
    /////////////////////////////

    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-share-facebook":
          return this.shareUrl("facebook");
        case "volt-share-twitter":
          return this.shareUrl("twitter");
        case "volt-share-linkedin":
          return this.shareUrl("linkedin");
        case "volt-select-language":
          return this.updateStorage(event.target.volt_language.value);
      }
    });


}(window, rJS, RSVP, Math));