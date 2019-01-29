/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var OPTION_DICT = {
    "youtube_id": "AIzaSyAZnEMo9kEXsIxVS0OmnxMpNfRGuMzrY8c"
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

  rJS(window)

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "body_tags": gadget.element.querySelectorAll('[data-i18n]')
        //, "attr_tags": gadget.element.querySelectorAll('[data-i19n]')
      };
    })

    /////////////////////////////
    // published methods
    /////////////////////////////
    .allowPublicAcquisition("translateDom", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      var i;
      var tag;
      var tag_list;
      var tag_len;
      var dictionary = my_payload[0];
      var dom = my_payload[1];

      if (dom && !isString(dom)) {
        tag_list = dom.querySelectorAll('[data-i18n]');
      } else {
        tag_list = dict.body_tags;
      }
      tag_len = tag_list.length;

      for (i = 0; i < tag_len; i += 1) {
        tag = tag_list[i];
        tag.textContent = dictionary[tag.getAttribute('data-i18n')];
      }
      // Sonderlocke
      // gadget.element.querySelector('[data-i19n]').setAttribute("value", dictionary[TITLE]);
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    .declareService(function () {
      var gadget = this;
      return gadget.getDeclaredGadget("candidature")
        .push(function (my_candidature_gadget) {
          return my_candidature_gadget.render(OPTION_DICT);
        })
        .push(null, function (my_error) {
          throw my_error;

          // poor man's error handling
          var fragment = window.document.createDocumentFragment();
          var p = window.document.createElement("p");
          var br = window.document.createElement("br");
          var a = window.document.createElement("a");
          var body = window.document.getElementsByTagName('body')[0];
          p.classList.add("vote-error");
          p.textContent = "Sorry, we messed up or your browser does not seem to support this application :( ";
          a.classList.add("vote-error-link");
          a.textContent = "www.votefrance.eu";
          a.setAttribute("href", "https://www.votefrance.eu/");
          fragment.appendChild(p);
          fragment.appendChild(br);
          fragment.appendChild(a);
  
          while (body.firstChild) {
            body.removeChild(body.firstChild);
          }
          body.appendChild(fragment);
        });
    });

}(window, rJS, RSVP));