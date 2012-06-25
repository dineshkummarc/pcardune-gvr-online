/**
 * @name gvr.i18n
 * @namespace namespace for everything having to do with internationalization
 */
goog.provide("gvr.i18n");

gvr.i18n.translationMap = {};
gvr.i18n.defaultLocale = "en-US"; // this id just a default
gvr.i18n.locale = null;

gvr.i18n.getBrowserLocale = function(){
    //ToDo: actually get the browser language
    if ( !gvr.i18n.locale && navigator ) {
        var locale = null;
        if ( navigator.language ) {
            locale = navigator.language;
        }
        else if ( navigator.browserLanguage ) {
            locale = navigator.browserLanguage;
        }
        else if ( navigator.systemLanguage ) {
            locale = navigator.systemLanguage;
        }
        else if ( navigator.userLanguage ) {
            locale = navigator.userLanguage;
        }
        gvr.i18n.locale = locale ? locale.replace("_","-") : null;
    }
    return gvr.i18n.locale || gvr.i18n.defaultLocale;
};

gvr.i18n.LocaleTranslation = Class.extend(
    {
        init: function(locale, name, translations){
            this.locale = locale;
            this.name = name;
            this.translations = translations;
        },

        getTranslation: function(messageId){
            return this.translations[messageId];
        }
    });

gvr.i18n.registerTranslation = function(locale, name, translations){
    gvr.i18n.translationMap[locale] = new gvr.i18n.LocaleTranslation(locale, name, translations);
};

gvr.i18n.TranslatedString = Class.extend(
    /** @lends gvr.i18n.TranslatedString# */
    {
        /**
         * @class A translated string
         * @constructs
         * @param messageId The id of the message for translation
         * @param defaultTranslation The default translation if none is found.
         * @param locale The translation locale.
         */
        init: function(messageId, defaultTranslation, locale){
            this.messageId = messageId;
            this.defaultTranslation = defaultTranslation;
            this.locale = locale || gvr.i18n.getBrowserLocale();
            this._cachedTranslation = null;
        },

        getTranslation: function(){
            if (this._cachedTranslation){
                return this._cachedTranslation;
            }
            var localeTranslation = gvr.i18n.translationMap[this.locale];
            if (localeTranslation){
                var translation = localeTranslation.getTranslation(this.messageId);
                if (translation){
                    this._cachedTranslation = translation;
                    return translation;
                }
            }
            return null;
        },

        toString: function(){
            return this.getTranslation() || this.defaultTranslation;
        }
    });

gvr.i18n.newTranslatedString = function(messageId, defaultTranslation, locale){
    return new gvr.i18n.TranslatedString(messageId, defaultTranslation, locale);
};