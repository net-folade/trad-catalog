(function () {
  'use strict';

  function whatsappUrl(message) {
    return 'https://wa.me/' + window.CONFIG.whatsapp + '?text=' + encodeURIComponent(message);
  }

  window.CONTACT = {
    instagramUrl: function () {
      return 'https://instagram.com/' + window.CONFIG.instagram;
    },
    enquireUrl: function (product) {
      return whatsappUrl("Hi Glideline — I'm interested in " + product.name + ' (' + product.id + ').');
    },
    picksUrl: function (products) {
      var lines = products.map(function (product) {
        return '• ' + product.name + ' (' + product.id + ')';
      });
      return whatsappUrl("Hi Glideline — I'm interested in:\n" + lines.join('\n'));
    },
    helloUrl: function () {
      return whatsappUrl("Hi Glideline — I'd like to ask about making an outfit.");
    }
  };
}());
