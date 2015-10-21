jquery.geocode
==============

`jQuery.geocode` is a jQuery plugin that simplifies client side geocoding with
Google when using it with search form and location pickers.

**Features:**

 * Intagrates with Google Maps for interactive location pickers
 * Support for address with multiple fields (street address, postal code, city, country)
 * Applies result coordinates to hidden fields so it integrates easily with the rest of your app.
 * Exports either a set of coordinates and a zoom amount ot viewport coordinates
 * Supports error feedback messages.

Usage
-----

Basic usage:

```js
$('.geocode-assist').geocode(options);
```

### Configuration options

| Option               | Default value | Type     | Description                    |
| -------------------- | ------------- | -------- | ------------------------------ |
| map                  | `undefined`   | Object   | Configuration options if the geocode is using an interactive map |
| map.selector         | `undefined`   | String   | A jQuery selector pointing to an element which will be replaced by a Google map
| map.defaultLatitude  | `0`           | Float    | Floating point number representing the default latitude if no latitude is provided via the `latitudeSelector`
| map.defaultLongitude | `0`           | Float    | Floating point number representing the default longitude if no latitude is provided via the `longitudeSelector`
| map.defaultZoom      | `2`           | Float    | Default zoom level if no zoom level is provided
| map.googleMapOptions | `{}`          | Object   | Configuration passed to the `google.maps.Map` object. See the [Google Map Options][google-map-options-docs] documentation for details.
| multipleFields       | `undefined`   | Object   | jQuery selectors for the different fields types
| multipleFields.addressLineSelector | `'.address-line'` | String | One or more inputs containing address information. Their results is concatenated with a coma when performing geocoding lookups.
| multipleFields.localitySelector | `'.locality'` | String | One or more inputs containing locality information. Their results is concatenated with a coma when performing geocoding lookups.
| multipleFields.postalCodeSelector | `'.postal-code'` | String | A single input representing a postal code
| multipleFields.countryCodeSelector | `'.country-code'` | String | A single input with value being a two letter [ISO 3166-1][iso-3166-1] country code.
| latitudeSelector     | `'.latitude'` | String   | A jQuery selector representing the element containing the latitude input field.
| longitudeSelector     | `'.longitude'` | String   | A jQuery selector representing the element containing the longitude input field.
| viewportSelector     | `'.viewport'` | String   | A jQuery selector representing the element containing the viewport input field. This will contain a JSON array of 2 coordinates the North-East and the South-West corner of the viewport a given location corresponds to.
| zoomSelector         | `'.zoom'`     | String   | A jQuery selector representing the element containing the map zoom input field.
| errorSelector        | `'.geocode-error'` | String   | A jQuery selector representing an element that will be shown if there is an error with the lookup request and hidden if successful.
| parent               | `form`        | String   | A jQuery selector representing the container element of the geocode inputs |
| requestTimeout       | `800`         | Integer  | The minimum amount of time in milliseconds between geocoding requests. Implemented via a debouncer function.

Examples
--------

### Location Search Form

JavaScript:
```js
$('.geocode-map-assist').geocode();
```

HTML:
```html
<form method="post" action="location/12da73/save">
  <input type="hidden" class="viewport" name="viewport">
  <input type="hidden" class="latitude" name="latitude">
  <input type="hidden" class="longitude" name="longitude">
  <input type="text" class="geocode-assist" name="query" placeholder="Enter Destination">
</form>
```

### Geocoding with a map picker and multiple fields
JavaScript:
```js
$('.geocode-map-assist').geocode({
  map: {
    selector: '.geocode-map',
    googleMapOptions: {
      streetViewControl: false
    }
  },
  multipleFields: true
});
```

HTML:
```html
<form class="geocode-map-assist" method="post" action="location/12da73/save">
  <input type="hidden" class="zoom" name="zoom" value="8">
  <input type="hidden" class="latitude" name="latitude" value="51.5073509">
  <input type="hidden" class="longitude" name="longitude" value="-0.12775829999998223">
  <input type="text" class="address-line" name="address-line-1" placeholder="Address Line 1">
  <input type="text" class="address-line" name="address-line-2" placeholder="Address Line 2 (Optional)">
  <input type="text" class="locality" name="city" placeholder="City">
  <input type="text" class="postal-code" name="postal-code" placeholder="Postal code">
  <select class="country-code" name="country">
    <option value="">Select Country</option>
    <option value="AF">Afghanistan</option>
    <option value="AX">Åland Islands</option>
    <option value="AL">Albania</option>
  </select>
  <div class="geocode-map" style="width: 60%; height: 300px"></div>
</form>
```

You might also want to put a Marker at the center of the map pointing at the
currently selected location. Here is an example how, but alternatives can be
found on [this][so-google-map-center-marker] Stack Overflow answer.

```css
.geocode-map {
    position: relative;
}

.geocode-map:after {
    width: 22px;
    height: 40px;
    display: block;
    content: ' ';
    position: absolute;
    top: 50%; left: 50%;
    margin: -40px 0 0 -11px;
    background: url('https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png');
    background-size: 22px 40px; /* Since I used the HiDPI marker version this compensates for the 2x size */
    pointer-events: none; /* This disables clicks on the marker. Not fully supported by all major browsers, though */
}
```

License
-------

This plugin and the associated documentation are distributed under the terms of
the MIT License. See `COPYING` for more details.

[google-map-options-docs]: https://developers.google.com/maps/documentation/javascript/3.exp/reference#MapOptions
[iso-3166-1]: https://en.wikipedia.org/wiki/ISO_3166-1
[so-google-map-center-marker]: http://stackoverflow.com/a/32892084/894209
