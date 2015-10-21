// The MIT License (MIT)
//
// Copyright (c) <2015> Itay Grudev <itay@grudev.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// ==ClosureCompiler==
// @output_file_name jquery.geocode.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==
(function ( $, undefined ) {
  var defaults = {
      'map': undefined,
      'multipleFields': undefined,
      'latitudeSelector': '.latitude',
      'longitudeSelector': '.longitude',
      'viewportSelector': '.viewport',
      'zoomSelector': '.zoom',
      'errorSelector': '.geocode-error',
      'parent': 'form',
      'requestTimeout': 800
    };

    // The actual plugin constructor
    function Plugin( element, options ) {
      this.element = element;
      this.options = $.extend( {}, defaults, options);
      this.init();
    }

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  function debounce(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			func.apply(context, args);
  		};
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  	};
  };

  Plugin.prototype.init = function () {
    // Google Map Assist
    if( typeof this.options['map'] == 'object' ) {
      this.options['map'] = $.extend({
        'selector': undefined,
        'defaultLatitude': 0,
        'defaultLongitude': 0,
        'defaultZoom': 2,
        'googleMapOptions': {}
      }, this.options['map']);

      // If no map.selector is provided
      if( this.options['map'].selector != this.options.map.selector ) {
        console.error('jquery.geocode: no map.selector provided');
      } else {
        this.hasMap = true;

        // Aquire server supplied initial location coordinates
        var center = { }, zoom;
        center['lat'] = parseFloat( $(this.element).closest(this.options.parent).find(this.options['latitudeSelector']).val() );
        center['lng'] = parseFloat( $(this.element).closest(this.options.parent).find(this.options['longitudeSelector']).val() );
        zoom = parseFloat( $(this.element).closest(this.options.parent).find(this.options['zoomSelector']).val() );

        // Check if no coordinates are provided and initialize with default values
        if ( center['lat'] != center['lat'] || center['lng'] != center['lng'] ) {
          center = {
            'lat': this.options['map'].defaultLatitude,
            'lng': this.options['map'].defaultLongitude
          };
        }
        if ( zoom != zoom ) zoom = this.options['map'].defaultZoom;

        // Initialize the Google Map
        var mapOptions = $.extend(this.options.map.googleMapOptions, {
          'zoom': zoom,
          'center': center
        });

        // Support individual map for each geocode and/or one map for all
        var mapElement;

        // Check whether only one object matches the map.selector
        if( $(this.options.map.selector).length == 1 ) {
          mapElement = $(this.options['map'].selector)[0];
        } else {
          // Otherwise dynamically lookup the DOM trabersing upwards from the
          // current element
          var mapCandidates;

          mapElement = $(this.element);

          while( ( mapElement = mapElement.parent() ).length > 0 ) {
            mapCandidates = mapElement.find(this.options['map'].selector);

            // Only one child - this should be the one (hierarchy in action)
            if( mapCandidates.length == 1 ) {
              mapElement = mapCandidates[0];
              break;
            }
          }
        }

        // Check whether no match was actually found and display an error message
        if( mapElement instanceof jQuery ) {
          console.error('jquery.geocode: no elements found using provided map.selector');
        } else {
          this.map = new google.maps.Map( mapElement, mapOptions );
          // Bind to the center_changed event
          var __extractLocationData = (function(){
            var $this = this;
            return debounce(function() {
              var location = $this.map.getCenter();
              $($this.element).closest($this.options.parent).find($this.options['latitudeSelector']).val( location.lat() );
              $($this.element).closest($this.options.parent).find($this.options['longitudeSelector']).val( location.lng() );
              $($this.element).closest($this.options.parent).find($this.options['zoomSelector']).val( $this.map.getZoom() );
              $this.locationResolved = true;
            }, 100);
          }).apply(this);

          this.map.addListener('center_changed', __extractLocationData);
          this.map.addListener('zoom_changed', __extractLocationData);
        }
      }
    }

    // Multiple fields support
    if( typeof this.options.multipleFields != 'undefined' ) {
      this.options.multipleFields = $.extend({
        'addressLineSelector': '.address-line',
        'localitySelector': '.locality',
        'postalCodeSelector': '.postal-code',
        'countryCodeSelector': '.country-code'
      }, (typeof this.options.multipleFields == 'object')? this.options.multipleFields: {} );

      this.hasMultipleFields = true;
    }

    var __addressUpdated = (function(){
      var $this = this;
      return function() {
        $this.locationResolved = false;
        $this.geocodeDebounce.apply($this);
      }
    }).apply(this);

    // Handle field change and submit events
    if( this.hasMultipleFields == true  ) {
      $(this.element).closest(this.options.parent).find(this.options['multipleFields'].addressLineSelector).on('input change',__addressUpdated);
      $(this.element).closest(this.options.parent).find(this.options['multipleFields'].localitySelector).on('input change',__addressUpdated);
      $(this.element).closest(this.options.parent).find(this.options['multipleFields'].postalCodeSelector).on('input change',__addressUpdated);
      $(this.element).closest(this.options.parent).find(this.options['multipleFields'].countryCodeSelector).on('input change',__addressUpdated);
    } else {
      $(this.element).on('input',__addressUpdated);
    }

    // Handle form submits
    var __verifyGeolocation = (function(){
      var $this = this;
      return function(event) {
        // If the no resolution is available, do not submit the form
        if( ! $this.locationResolved ) {
          $this.submitFormAfterResolution = true;
          // If no resulution is pending start one immediately without debouncing
          if( ! $this.resolutionInProgress ) {
            $this.geocode();
          }
          event.preventDefault();
        }
      }
    }).apply(this);
    $(this.element).closest(this.options.parent).submit(__verifyGeolocation);

    this.geocodeDebounce = debounce(this.geocode, this.options['requestTimeout']);
    this.locationResolved = false;
    this.resolutionInProgress = false;
    this.submitFormAfterResolution = false;
  };

  Plugin.prototype.geocode = function() {
    this.resolutionInProgress = true;

    var address, restrictions = { };
    // Address provided via multiple fields
    if( this.hasMultipleFields == true ) {
      // Concat all matched address lines
      address = $(this.element).closest(this.options.parent).find(this.options['multipleFields'].addressLineSelector).map(function(){
        return $(this).val();
      }).get().join(' ');

      // Concat all matched locality fields
      restrictions['locality'] = $(this.element).closest(this.options.parent).find(this.options['multipleFields'].localitySelector).map(function(){
        return $(this).val();
      }).get().join(' ');
      if( typeof restrictions['locality'] == 'undefined' || restrictions['locality'] == '' ) delete restrictions['locality'];

      // There should be a single postal code field
      restrictions['postalCode'] = $(this.element).closest(this.options.parent).find(this.options['multipleFields'].postalCodeSelector).val();
      if( typeof restrictions['postalCode'] == 'undefined' || restrictions['postalCode'] == '' ) delete restrictions['postalCode'];

      // And a single country code field
      restrictions['country'] = $(this.element).closest(this.options.parent).find(this.options['multipleFields'].countryCodeSelector).val();
      if( typeof restrictions['country'] == 'undefined' || restrictions['country'] == '' ) delete restrictions['country'];
    } else {
      address = $(this.element).val();
    }

    // Start a Geocoding API request
    var geocoder = new google.maps.Geocoder();
    var __geocodeResult = (function(){
      var $this = this;
      return function(results, status) {
        // If the API call was successful
        if (status == google.maps['GeocoderStatus']['OK']) {

          // Update the map if this assist is associated with one
          if( $this.hasMap == true ) {
            $this.map.fitBounds(results[0]['geometry']['viewport']);
            $this.map.setCenter(results[0]['geometry']['location']);
          }

          // Update the longitude, latitude, zoom and viewport hidden fields
          $($this.element).closest($this.options.parent).find($this.options['latitudeSelector']).val( results[0].geometry.location.lat() );
          $($this.element).closest($this.options.parent).find($this.options['longitudeSelector']).val( results[0].geometry.location.lng() );
          $($this.element).closest($this.options.parent).find($this.options['viewportSelector']).val( JSON.stringify([
            results[0]['geometry']['viewport'].getNorthEast().lat(),
            results[0]['geometry']['viewport'].getNorthEast().lng(),
            results[0]['geometry']['viewport'].getSouthWest().lat(),
            results[0]['geometry']['viewport'].getSouthWest().lng()
          ]));

          $this.resolutionInProgress = false;
          $this.locationResolved = true;

          if( $this.submitFormAfterResolution == true ) {
            $($this.element).closest($this.options.parent).submit();
          }

          // If an address had been resolved do not show an error message
          $($this.element).closest($this.options.parent).find($this.options['errorSelector']).hide();
        } else {
          $this.submitFormAfterResolution.resolutionInProgress = false;
          $this.submitFormAfterResolution.locationResolved = false;

          // When no address was resolved display an error
          $($this.element).closest($this.options.parent).find($this.options['errorSelector']).show();
        }
      }
    }).apply(this);
    geocoder.geocode( { 'address': address, 'componentRestrictions': restrictions }, __geocodeResult );
  }

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $['fn']['geocode'] = function ( options ) {
    return this.each(function () {
        if ( ! $.data(this, 'plugin_geocode') ) {
            $.data( this, 'plugin_geocode', new Plugin( this, options ) );
        }
    });
  }
})( jQuery );
