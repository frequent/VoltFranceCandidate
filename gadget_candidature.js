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
  var CANDIDATURE = "candidature: ";
  var BLANK = "_blank";
  var SPACE = " ";
  var NAME = "name";
  var BREAK = "\r\n";
  var VOLT = "volt_jio";
  var TUBE = "tube_jio";
  var HI = "hd720";
  var LO = "tiny";
  var INVALID = "is-invalid";
  var LOCATION = window.location;
  var DOCUMENT = window.document;
  var SETTING = "setting_jio";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var LANG = "https://raw.githubusercontent.com/VoltEuropa/VoltFranceCandidate/master/lang/";


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
      "path": "lang/" + my_language
      //"__debug": "https://softinst103163.host.vifib.net/candid/lang/" + my_language + "/debug.json"
    };
  }

  function getVideoHash() {
    return "aGCqcHZ73eo";
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
        "i18n_dict": {},
        "main": getElem(element, ".volt-player-content"),
        "player_container": getElem(element, ".volt-player-container"),
        "player": null
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
    .declareMethod("tube_create", function (my_option_dict) {
      return this.route(TUBE, "createJIO", my_option_dict);
    })
    .declareMethod("tube_allDocs", function (my_option_dict) {
      return this.route(TUBE, "allDocs", my_option_dict);
    })
    .declareMethod("tube_get", function (my_id) {
      return this.route(TUBE, "get", my_id);
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
    .declareMethod("setting_create", function (my_option_dict) {
      return this.route(SETTING, "createJIO", my_option_dict);
    })
    .declareMethod("setting_getAttachment", function (my_id, my_tag, my_dict) {
      return this.route(SETTING, "getAttachment", my_id, my_tag, my_dict);
    })
    .declareMethod("setting_putAttachment", function (my_id, my_tag, my_dict) {
      return this.route(SETTING, "putAttachment", my_id, my_tag, my_dict);
    })
    .declareMethod("setting_removeAttachment", function (my_id, my_tag) {
      return this.route(SETTING, "removeAttachment", my_id, my_tag);
    })

    // -------------------------- Video ----------------------------------------
    .declareMethod("loadVideo", function (my_video_id) {
      var gadget = this;
      var dict = gadget.property_dict;
      var tube_data = {"items": ARR};

      if (!my_video_id) {
        return;
      }

      if (!gadget.state.online) {
        return RSVP.all([
          gadget.resetFrube(true),
          gadget.waitForNetwork(my_video_id)
        ]);
      }

      return new RSVP.Queue()
        .push(function () {
          return gadget.getSetting("quality");
        })
        .push(function (quality) {
          return gadget.stateChange({"quality": [LO, HI][quality + 0]});
        })
        .push(function () {
          var player = dict.player;
          var main = dict.main;

          function handleReady(my_event) {
            return my_event.target.playVideo();
          }
          function handleError(my_event) {
            return gadget.handleError(my_event);
          }
          function handleStateChange() {
            return gadget.videoOnStateChange();
          }

          if (!player || (player && !player.h)) {
            while (true) {
              try {
                dict.player = new YT.Player("player", {
                  "videoId": my_video_id,
                  "width": main.clientWidth,
                  "height": Math.max(main.clientWidth * 0.66 * 9 / 16, 250),
                  "events": {
                    "onReady": handleReady,
                    "onStateChange": handleStateChange,
                    "onError": handleError
                  },
                  "playerVars": {
                    "showinfo": 0,
                    "disablekb": 1,
                    "iv_load_policy": 3,
                    "rel": 0,
                    "vq": gadget.state.quality,
                    //"fs": 0
                  }
                });
              break;
            } catch (err) {
              continue;
            }
          }

          // let's see if this goes smoothly
          } else if (player.loadVideoById) {
            player.loadVideoById(my_video_id);
          }
          return;
        })
        .push(function () {
          return gadget.tube_get(my_video_id);
        })
        .push(function (tube_response) {
          tube_data = tube_response;
          //return gadget.frube_get(my_video_id);
        //})
        //.push(undefined, function (error) {
        //  return gadget.handleError(error, {"404": {}});
        //})
        //.push(function (frube_response) {
          var data = frube_response;
          var state = gadget.state;
          var item_list = tube_data.items || [{}];
          var item = dict.current_video = mergeDict(item_list[0], /*data*/ {});
          if (item) {
            DOCUMENT.title = item.snippet.title;
          }
          return;
        });
    })

    // -------------------------- Video ----------------------------------------
    .declareMethod("getSetting", function (my_setting) {
      var gadget = this;
      return gadget.setting_getAttachment("/", my_setting, {format: "text"})
        .push(function (response) {
          var payload = JSON.parse(response);
          if (getTimeStamp() - payload.timestamp > TEN_MINUTES) {
            return gadget.setting_removeAttachment("/", "token");
          }
          return payload[my_setting];
        })
        .push(undefined, function (my_error) {
          return gadget.handleError(my_error, {"404": 0});
        });
    })

    .declareMethod("handleError", function (my_err, my_err_dict) {
      var gadget = this;
      var code;
      var err = my_err.target ? JSON.parse(my_err.target.response).error : my_err;

      if (err instanceof RSVP.CancellationError) {
        gadget.state.is_searching = false;
        return gadget.stateChange({"loader": null});
      }

      for (code in my_err_dict) {
        if (my_err_dict.hasOwnProperty(code)) {
          if ((err.status_code + STR) === code) {
            return my_err_dict[code];
          }
        }
      }
      throw err;
    })

    .declareMethod("videoOnStateChange", function () {
      var gadget = this;
      var player = gadget.property_dict.player;
      var current_state = player.getPlayerState();
      var play_icon = getElem(gadget.element, ".frube-btn-play-pause i");
      if (current_state === YT.PlayerState.ENDED) {
        if (getElem(gadget.element, REPEAT).checked) {
          player.seekTo(0, true);
          player.playVideo();
        } else {
          play_icon.textContent = "play_arrow";
          return gadget.jumpVideo(1);
        }
      } else if (current_state === YT.PlayerState.PLAYING) {
        play_icon.textContent = "pause";
      } else {
        play_icon.textContent = "play_arrow";
      }
    })

    .declareMethod("loadVideo", function (my_video_id) {
      var gadget = this;
      var dict = gadget.property_dict;
      var tube_data = {"items": ARR};

      if (!my_video_id) {
        return;
      }

      return new RSVP.Queue()
        .push(function () {
          return gadget.getSetting("quality");
        })
        .push(function (quality) {
          return gadget.stateChange({"quality": [LO, HI][quality + 0]});
        })
        .push(function () {
          var player = dict.player;
          var main = dict.main;

          function handleReady(my_event) {
            return my_event.target.playVideo();
          }
          function handleError(my_event) {
            return gadget.handleError(my_event);
          }
          function handleStateChange() {
            return gadget.videoOnStateChange();
          }

          if (!player || (player && !player.h)) {
            while (true) {
              try {
                dict.player = new YT.Player("player", {
                  "videoId": my_video_id,
                  "width": main.clientWidth,
                  "height": Math.max(main.clientWidth * 0.66 * 9 / 16, 250),
                  "events": {
                    "onReady": handleReady,
                    "onStateChange": handleStateChange,
                    "onError": handleError
                  },
                  "playerVars": {
                    "showinfo": 0,
                    "disablekb": 1,
                    "iv_load_policy": 3,
                    "rel": 0,
                    "vq": gadget.state.quality,
                    //"fs": 0
                  }
                });
              break;
            } catch (err) {
              continue;
            }
          }

          // let's see if this goes smoothly
          } else if (player.loadVideoById) {
            player.loadVideoById(my_video_id);
          }
          return;
        })
        .push(function () {
          return gadget.tube_get(my_video_id);
        })
        .push(function (tube_response) {
          tube_data = tube_response;
          //return gadget.frube_get(my_video_id);
        //})
        //.push(undefined, function (error) {
        //  return gadget.handleError(error, {"404": {}});
        //})
        //.push(function (frube_response) {
          var data = frube_response;
          var state = gadget.state;
          var item_list = tube_data.items || [{}];
          var item = dict.current_video = mergeDict(item_list[0], /* data */ {});
          if (item) {
            DOCUMENT.title = item.snippet.title;
          }
          return;
        });
    })

    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
      var dict = gadget.property_dict;
      var promise_list = [];
  
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
      if (delta.hasOwnProperty("play")) {
        state.play = window.location.hash = delta.play || STR;
        if (state.play && state.play === getVideoHash()) {
          promise_list.push(gadget.loadVideo(state.play));
        } else {
          promise_list.push(gadget.resetFrube());
        }
      }
      if (delta.hasOwnProperty("quality")) {
        if (dict.player && delta.quality !== state.quality) {
          dict.player.destroy();
        }
        state.quality = delta.quality;
      }
      return RSVP.all(promise_list);
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

    .declareMethod("openMail", function (my_target) {
      window.open('https://forms.gle/XJFq5bDPidquE2ae8');
      return;
    })

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;

      window.componentHandler.upgradeDom();
      mergeDict(dict, my_option_dict);
      return new RSVP.Queue()
        .push(function () {
          return RSVP.all([ 
            gadget.volt_create(getConfig(gadget.state.locale)),
            gadget.tube_create({"type": "youtube", "api_key": dict.youtube_id}),
            gadget.stateChange({"online": window.navigator.onLine}),
            gadget.tataaaa()
          ]);
        })
        .push(function () {
          return gadget.buildCalendarLookupDict();
        })
        .push(function () {
          return gadget.fetchTranslationAndUpdateDom(gadget.state.locale);
        })
        .push(function () {
          return gadget.stateChange({play: getVideoHash()});
        });
    })

    /////////////////////////////
    // declared jobs
    /////////////////////////////
    .declareJob("tataaaa", function () {
      var body = DOCUMENT.body;
      var seo = body.querySelector(".volt-seo-content");
      seo.parentElement.removeChild(seo);
      body.classList.remove("volt-splash");     
    })

    /////////////////////////////
    // declared service
    /////////////////////////////

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
        gadget.setting_create({"type": "local", "sessiononly": false}),
        listener(window, "online", false, handleConnection),
        listener(window, "offline", false, handleConnection),
      ]);
    })

    /////////////////////////////
    // on Event
    /////////////////////////////

    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-candidature":
          return this.openMail(event.target);
        case "volt-select-language":
          return this.updateStorage(event.target.volt_language.value);
      }
    });


}(window, rJS, RSVP, Math));