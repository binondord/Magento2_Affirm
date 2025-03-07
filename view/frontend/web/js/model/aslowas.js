/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*jshint browser:true jquery:true*/
/*global alert*/
define([
    "jquery",
    "mage/translate"
],
    function ($, $t) {

        var self;
        return {
            options: {},
            aSLowAsElement: 'affirm-as-low-as',

            /**
             * Get AsLowAs html element
             *
             * @returns {*}
             */
            getAsLowAsElement: function() {
                return this.options.aSLowAsElement ? this.options.aSLowAsElement : this.aSLowAsElement;
            },

            /**
             * Process price
             *
             * @param price
             */
            process: function(price, options) {
                self = this;
                var priceInt, optionsPrice;

                // Format price to cents
                priceInt = this.formatToPriceInt(price);

                if (options) {
                    self.options = options;
                }

                /**
                 * Specify options
                 *
                 * @type {{apr: (*|apr), months: (*|months|c.months|.step.months|gc.months|._data.months), amount: number}}
                 */
                optionsPrice = {
                    element_id: (options.element_id ? options.element_id : ''),
                    color_id: (options.color_id ? options.color_id : ''),
                    amount: priceInt
                };

                if (priceInt > 50) {
                    self.processAsLowAs(optionsPrice);
                } else {
                    self.hideAsLowAs(optionsPrice);
                }
            },

            /**
             * Helper function to format price to amount integer
             */
             formatToPriceInt: function (price) {
                var formatted, priceStr;

                priceStr = price.replace(/^(-)|[^0-9.,]+/g, '$1').trim();
                var result = priceStr.replace(/[^0-9]/g, '');
                if (/[,\.]\d{2}$/.test(priceStr)) {
                    result = result.replace(/(\d{2})$/, '.$1'); // restore decimal point
                }
                formatted = parseFloat(result);
                return formatted.toFixed(2) * 100;
            },

            /**
             * Hide As Low As
             */
            hideAsLowAs: function(options) {
                if(options.element_id) {
                    var element_als = document.getElementById(options.element_id);
                    if(element_als) {
                        element_als.style.visibility = "hidden";
                    }
                } else {
                    var elements = document.getElementsByClassName(self.getAsLowAsElement());
                    $.each(elements, function (key, element) {
                        var iText = ('innerText' in element) ? 'innerText' : 'textContent';
                        element[iText] = "";
                        element.style.visibility = "hidden";
                    });
                }
            },

            /**
             * Process as low as functionality
             *
             * @param options
             */
            processAsLowAs: function(options) {
                var self = this;
                affirm.ui.ready(function() {
                    if (options.amount) {
                        var isUpdate = self.updateAffirmAsLowAs(options.amount);
                        if (isUpdate) {
                            if(options.color_id) {
                                document.getElementById(options.element_id).setAttribute('data-affirm-color',options.color_id);
                            }
                            document.getElementById(options.element_id).setAttribute('data-amount',options.amount);
                        } else {
                            self.hideAsLowAs(options);
                        }
                    }
                });
            },

            /**
             * Update affirm as low as
             *
             * @param c This is amount in cents
             */
            updateAffirmAsLowAs: function(c) {
                if ((c == null) || (c > 1750000) || (c < 5000)) {
                    return false;
                }
                if ((this.options.min_order_total && c < this.options.min_order_total*100) ||
                    (this.options.max_order_total && c > this.options.max_order_total*100)
                ) {
                    return false;
                }
                if (c) {
                    this.options.amount = c;
                }
                return true;
            },


            /**
             * Load affirm script
             *
             * @private
             */
            loadScript: function(options) {
                var pubKey = options.public_api_key,
                    script = options.script,
                    locale = options.locale,
                    countryCode = options.country_code

                _affirm_config = {
                    public_api_key: pubKey, /* Use the PUBLIC API KEY Affirm sent you. */
                    script: script,
                    locale: locale,
                    country_code: countryCode,
                };
                (function (m, g, n, d, a, e, h, c) {
                    var b = m[n] || {},
                        k = document.createElement(e),
                        p = document.getElementsByTagName(e)[0],
                        l = function (a, b, c) {
                            return function () {
                                a[b]._.push([c, arguments]);
                            };
                        };
                    b[d] = l(b, d, "set");
                    var f = b[d];
                    b[a] = {};
                    b[a]._ = [];
                    f._ = [];
                    b._ = [];
                    b[a][h] = l(b, a, h);
                    b[c] = function () {
                        b._.push([h, arguments]);
                    };
                    a = 0;
                    for (c = "set add save post open empty reset on off trigger ready setProduct".split(" "); a < c.length; a++) f[c[a]] = l(b, d, c[a]);
                    a = 0;
                    for (c = ["get", "token", "url", "items"]; a < c.length; a++) f[c[a]] = function () {};
                    k.async = !0;
                    k.src = g[e];
                    p.parentNode.insertBefore(k, p);
                    delete g[e];
                    f(g);
                    m[n] = b;
                })(window, _affirm_config, "affirm", "checkout", "ui", "script", "ready", "jsReady");
            },

            /**
             * Process promo blocks visibility
             */
            processBackordersVisibility: function (options) {
                self = this;
                var isVissible = true;
                $.each(options, function (product_id, attributes) {
                    var flagCompatible = true,
                        flagBackorder  = false,
                        simpleProductId = 0;
                    $.each(attributes, function (key, value) {
                        if (key == 'backorders') {
                            flagBackorder = value;
                        } else {
                            var el = $('[attribute-id="' + key + '"]');
                            simpleProductId = parseInt(product_id);
                            if (!el || el.attr('option-selected') != value) {
                                flagCompatible = false;
                                simpleProductId = 0;
                                return false;
                            }
                        }
                    });
                    if (flagCompatible && simpleProductId > 0) {
                        if (flagBackorder) {
                            self.updatePromoBlocksVisibility('hidden');
                            isVissible = false;
                        } else {
                            self.updatePromoBlocksVisibility('visible');
                        }
                        return false;
                    }
                });
                if (isVissible) {
                    self.updatePromoBlocksVisibility('visible');
                }
            },

            /**
             * Update promo blocks visibility
             */
            updatePromoBlocksVisibility: function(visibility) {
                var asLowAs = document.getElementsByClassName(self.getAsLowAsElement());
                if (asLowAs) {
                    $.each(asLowAs, function (key, element) {
                        element.style.visibility = visibility;
                    });
                }
                var promoBanners = document.getElementsByClassName('affirm-promo');
                if (promoBanners[0]){
                    promoBanners[0].style.visibility = visibility;
                }
                return true;
            }
        }
    });
