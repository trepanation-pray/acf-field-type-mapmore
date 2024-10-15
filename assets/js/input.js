(function ($) {
  function initialize_field($el) {
    //$el.doStuff();
  }

  if (typeof acf.add_action !== "undefined") {
    /*
     *  ready append (ACF5)
     *
     *  These are 2 events which are fired during the page load
     *  ready = on page load similar to $(document).ready()
     *  append = on new DOM elements appended via repeater field
     *
     *  @type	event
     *  @date	20/07/13
     *
     *  @param	$el (jQuery selection) the jQuery element which contains the ACF fields
     *  @return	n/a
     */

    acf.add_action("ready append", function ($el) {
      // search $el for fields of type 'mapmore'
      acf.get_fields({ type: "mapmore" }, $el).each(function () {
        initialize_field($(this));
      });
    });
  } else {
    /*
     *  acf/setup_fields (ACF4)
     *
     *  This event is triggered when ACF adds any new elements to the DOM.
     *
     *  @type	function
     *  @since	0.3.1
     *  @date	01/01/12
     *
     *  @param	event		e: an event object. This can be ignored
     *  @param	Element		postbox: An element which contains the new HTML
     *
     *  @return	n/a
     */

    $(document).on("acf/setup_fields", function (e, postbox) {
      $(postbox)
        .find('.field[data-field_type="mapmore"]')
        .each(function () {
          initialize_field($(this));
        });
    });
  }
})(jQuery);

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
(function ($, window, document, undefined) {
  "use strict";

  // Create the defaults once
  var mapMore = "mapMore",
    defaults = {
      map: null,
      contextmenuClass: "mapmore-contextmenu",
      fieldname: null,
      defaultCircleRadius: 200000,
      menu: [
        {
          label: "Add Marker",
          function: "addMarker",
        },
        {
          label: "Add Circle",
          function: "addCircle",
        },
      ],
      draggable: true,
      single: true,
      editable: true,
      drawingManager: true,
      defaultStrokeColor: "#FF0000",
      defaultStrokeOpacity: 0.8,
      defaultStrokeWeight: 2,
      defaultFillColor: "#FF0000",
      defaultFillOpacity: 0.35,
      markerOptions: [],
      defaultMarker: null,
    };

  // The actual plugin constructor
  function MapMore(element, options) {
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = mapMore;
    this.init();
  }

  // Avoid MapMore.prototype conflicts
  $.extend(MapMore.prototype, {
    init: function () {
      this.map = this.settings.map;
      this.mapDiv = this.map.getDiv();
      this.locations = this.settings.locations;
      this.mapObjects = [];

      this.addEventListeners();

      this.setLocations();

      this.fitBounds();

      this.activateIconSelect();

      if (this.settings.drawingManager && this.settings.editable)
        this.setDrawingManager();
    },

    activateIconSelect: function () {
      var self = this;

      $("[data-acf-field-mapmore-icon]").click(function () {
        $("[data-acf-field-mapmore-icon]").removeClass("active");

        $(this).addClass("active");

        self.settings.defaultMarker = $(this).data("acf-field-mapmore-icon");
      });
    },

    addEventListeners: function () {
      var self = this;

      // Display context menu on right click
      google.maps.event.addListener(self.map, "rightclick", function (event) {
        // Store last clicked position
        self.lastClickedPosition = event;

        // Show context menu
        self.contextmenu(event.latLng, event.pixel);
      });

      // Close context menus on click
      google.maps.event.addListener(self.map, "click", function (event) {
        self.closeContextmenus();
      });

      // Close context menus on zoom change
      google.maps.event.addListener(self.map, "zoom_changed", function (event) {
        self.closeContextmenus();
      });

      // Close context menus on drag
      google.maps.event.addListener(self.map, "drag", function (event) {
        self.closeContextmenus();
      });

      // clear map
      document.addEventListener('click', function (event) {
        if (!event.target.matches('#mapmore-clear-map')) return;
        self.clearLocations();
        self.storeLocations();

        var $input = jQuery('input[name="' + self.settings.fieldname + '"]');

        $input.val("");

        self.locations = [];
      });


      // clear marker selection
      document.addEventListener('click', function (event) {
        if (!event.target.matches('#mapmore-clear-marker')) return;
          $("[data-acf-field-mapmore-icon]").removeClass("active");
          self.settings.defaultMarker = null;
      });
    
    },

    // Inside your MapMore plugin's setDrawingManager function
    setDrawingManager: function () {
      var self = this;

      var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null, // Set to null to start without any drawing mode active
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.MARKER,
            google.maps.drawing.OverlayType.CIRCLE,
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.POLYLINE,
            google.maps.drawing.OverlayType.RECTANGLE,
          ],
        },
        markerOptions: {
          draggable: self.settings.draggable,
        },
        circleOptions: {
          strokeColor: self.settings.defaultStrokeColor,
          strokeOpacity: self.settings.defaultStrokeOpacity,
          strokeWeight: self.settings.defaultStrokeWeight,
          fillColor: self.settings.defaultFillColor,
          fillOpacity: self.settings.defaultFillOpacity,
          editable: self.settings.editable,
          zIndex: 1,
        },
        polygonOptions: {
          strokeColor: self.settings.defaultStrokeColor,
          strokeOpacity: self.settings.defaultStrokeOpacity,
          strokeWeight: self.settings.defaultStrokeWeight,
          fillColor: self.settings.defaultFillColor,
          fillOpacity: self.settings.defaultFillOpacity,
          editable: self.settings.editable,
          zIndex: 1,
        },
        polylineOptions: {
          strokeColor: self.settings.defaultStrokeColor,
          strokeOpacity: self.settings.defaultStrokeOpacity,
          strokeWeight: self.settings.defaultStrokeWeight,
          editable: self.settings.editable,
          zIndex: 1,
        },
        rectangleOptions: {
          strokeColor: self.settings.defaultStrokeColor,
          strokeOpacity: self.settings.defaultStrokeOpacity,
          strokeWeight: self.settings.defaultStrokeWeight,
          fillColor: self.settings.defaultFillColor,
          fillOpacity: self.settings.defaultFillOpacity,
          editable: self.settings.editable,
          zIndex: 1,
        },
      });
      drawingManager.setMap(this.map);

      // Handle the overlaycomplete event
      google.maps.event.addListener(drawingManager, "overlaycomplete", function (event) {
        var locationObject;
        var newShape = event.overlay;

        // Determine the type of shape and create a corresponding location object
        switch (event.type) {
          case google.maps.drawing.OverlayType.MARKER:
            locationObject = {
              type: "marker",
              lat: newShape.getPosition().lat(),
              lng: newShape.getPosition().lng(),
            };

            // Set marker properties
            newShape.setDraggable(self.settings.draggable);

            // Add event listener for position changes
            google.maps.event.addListener(newShape, 'dragend', function () {
              locationObject.lat = newShape.getPosition().lat();
              locationObject.lng = newShape.getPosition().lng();
              self.storeLocations();
            });

            break;

          case google.maps.drawing.OverlayType.CIRCLE:
            locationObject = {
              type: "circle",
              lat: newShape.getCenter().lat(),
              lng: newShape.getCenter().lng(),
              radius: newShape.getRadius(),
            };

            // Set circle properties
            newShape.setEditable(self.settings.editable);

            // Add event listeners for radius and center changes
            google.maps.event.addListener(newShape, 'radius_changed', function () {
              locationObject.radius = newShape.getRadius();
              self.storeLocations();
            });
            google.maps.event.addListener(newShape, 'center_changed', function () {
              locationObject.lat = newShape.getCenter().lat();
              locationObject.lng = newShape.getCenter().lng();
              self.storeLocations();
            });

            break;

          case google.maps.drawing.OverlayType.POLYGON:
            locationObject = {
              type: "polygon",
              path: newShape.getPath().getArray(),
            };

            // Set polygon properties
            newShape.setEditable(self.settings.editable);

            // Add event listeners for path changes
            attachPathListeners(newShape.getPath(), locationObject, 'path');

            break;

          case google.maps.drawing.OverlayType.POLYLINE:
            locationObject = {
              type: "polyline",
              path: newShape.getPath().getArray(),
            };

            // Set polyline properties
            newShape.setEditable(self.settings.editable);

            // Add event listeners for path changes
            attachPathListeners(newShape.getPath(), locationObject, 'path');

            break;

          case google.maps.drawing.OverlayType.RECTANGLE:
            locationObject = {
              type: "rectangle",
              bounds: newShape.getBounds().toJSON(),
            };

            // Set rectangle properties
            newShape.setEditable(self.settings.editable);

            // Add event listener for bounds changes
            google.maps.event.addListener(newShape, 'bounds_changed', function () {
              locationObject.bounds = newShape.getBounds().toJSON();
              self.storeLocations();
            });

            break;
        }

        // Add the new location object to the locations array
        self.locations.push(locationObject);

        // Add the new shape to the mapObjects array
        self.mapObjects.push(newShape);

        // Add right-click listener for deleting the shape
        google.maps.event.addListener(newShape, 'rightclick', function (event) {
          if (event.vertex != null && (event.type === 'polyline' || event.type === 'polygon')) {
            // Remove the vertex if right-clicked on a vertex
            newShape.getPath().removeAt(event.vertex);
            locationObject.path = newShape.getPath().getArray();
            self.storeLocations();
          } else {
            // Remove the shape completely
            newShape.setMap(null);

            // Find the index of the shape in mapObjects
            var shapeIndex = self.mapObjects.indexOf(newShape);

            if (shapeIndex !== -1) {
              self.mapObjects.splice(shapeIndex, 1);
              self.locations.splice(shapeIndex, 1);
              self.storeLocations();
            }
          }
        });

        // Store the updated locations array
        self.storeLocations();

        // Disable drawing mode after adding the shape
        drawingManager.setDrawingMode(null);
      });

      // Function to attach event listeners to paths (used for polygons and polylines)
      function attachPathListeners(path, locationObject, property) {
        google.maps.event.addListener(path, 'set_at', function () {
          locationObject[property] = path.getArray();
          self.storeLocations();
        });
        google.maps.event.addListener(path, 'insert_at', function () {
          locationObject[property] = path.getArray();
          self.storeLocations();
        });
        google.maps.event.addListener(path, 'remove_at', function () {
          locationObject[property] = path.getArray();
          self.storeLocations();
        });
      }
    },


    getContextmenuHtml: function () {
      var html = '<ul class="' + this.settings.contextmenuClass + '">';

      for (var key in this.settings.menu) {
        var item = this.settings.menu[key];

        html +=
          "<li>" +
          '<a href="#" data-function="' +
          item["function"] +
          '">' +
          item["label"] +
          "</a>" +
          "</li>";
      }

      html += "</ul>";

      return html;
    },

    closeContextmenus: function () {
      jQuery(this.mapDiv)
        .find("." + this.settings.contextmenuClass)
        .remove();
    },

    displayContextmenu: function () {
      jQuery(this.mapDiv)
        .find("." + this.settings.contextmenuClass)
        .css({
          visibility: "visible",
        });
    },

    activateContextMenu: function (path, vertext) {
      var self = this;

      jQuery(this.mapDiv)
        .find("." + this.settings.contextmenuClass + " a")
        .click(function () {
          event.preventDefault();

          var func = $(this).data("function");

          if (typeof self[func] == "undefined") {
            alert("Function " + func + " is not implemented.");
            return false;
          } else {
            self[func](self.lastClickedPosition);

            self.closeContextmenus();
          }
        });
    },

    addMarker: function (position) {
      var self = this,
        locationObject = {
          lat: position.latLng.lat(),
          lng: position.latLng.lng(),
          type: "marker",
        };

      if (this.settings.single) {
        this.locations = [locationObject];
      } else {
        this.locations.push(locationObject);
      }

      if (this.settings.single) this.clearLocations();

      this.setLocations();

      this.storeLocations();
    },

    addCircle: function (position) {
      var self = this,
        locationObject = {
          lat: position.latLng.lat(),
          lng: position.latLng.lng(),
          type: "circle",
          radius: self.settings.defaultCircleRadius,
        };

      if (this.settings.single) {
        this.locations = [locationObject];
      } else {
        this.locations.push(locationObject);
      }

      if (this.settings.single) this.clearLocations();

      this.setLocations();

      this.storeLocations();
    },

    clearLocations: function () {
      var self = this;
    
      for (var i = 0; i < self.mapObjects.length; i++) {
        self.mapObjects[i].setMap(null);
      }
      self.mapObjects = [];
    },
    

    storeLocations: function () {
      var $input = jQuery('input[name="' + this.settings.fieldname + '"]');

      $input.val(JSON.stringify(this.locations));
    },

    setLocations: function () {
      var self = this;
    
      // Clear existing map objects
      self.clearLocations();
    
      // Loop through locations and create map objects
      for (var i = 0; i < self.locations.length; i++) {
        (function (key) {
          var location = self.locations[key];
          var mapObject;
    
          switch (location.type) {
            case "polyline":
              mapObject = new google.maps.Polyline({
                path: location.path,
                strokeColor: self.settings.defaultStrokeColor,
                strokeOpacity: self.settings.defaultStrokeOpacity,
                strokeWeight: self.settings.defaultStrokeWeight,
                map: self.map,
                editable: self.settings.editable,
              });
    
              // Add to mapObjects array
              self.mapObjects.push(mapObject);
    
              // Set up event listeners with closure to capture 'key'
              google.maps.event.addListener(mapObject.getPath(), 'set_at', function () {
                self.locations[key].path = mapObject.getPath().getArray();
                self.storeLocations();
              });
              google.maps.event.addListener(mapObject.getPath(), 'insert_at', function () {
                self.locations[key].path = mapObject.getPath().getArray();
                self.storeLocations();
              });
              google.maps.event.addListener(mapObject.getPath(), 'remove_at', function () {
                self.locations[key].path = mapObject.getPath().getArray();
                self.storeLocations();
              });
    
              // Add right-click listener for deletion
              google.maps.event.addListener(mapObject, 'rightclick', function (event) {
                if (event.vertex != null) {
                  // Remove the vertex if needed
                  mapObject.getPath().removeAt(event.vertex);
                } else {
                  // Remove the entire polyline
                  mapObject.setMap(null);
                  self.mapObjects.splice(key, 1);
                  self.locations.splice(key, 1);
                  self.storeLocations();
                }
              });
    
              break;
    
            // Handle other types (markers, circles, etc.) similarly
          }
        })(i); // Pass 'i' as 'key' to the closure
      }
    },
    

    fitBounds: function () {
      var bounds = new google.maps.LatLngBounds();
      var hasBounds = false;

      for (var key in this.mapObjects) {
        var mapObject = this.mapObjects[key];

        if (
          mapObject instanceof google.maps.Circle ||
          mapObject instanceof google.maps.Rectangle
        ) {
          bounds.union(mapObject.getBounds());
          hasBounds = true;
        }

        if (mapObject instanceof google.maps.Polygon) {
          mapObject.getPaths().forEach(function (path) {
            path.forEach(function (latLng) {
              bounds.extend(latLng);
            });
          });
          hasBounds = true;
        }
      }

      if (hasBounds) {
        this.map.fitBounds(bounds);
        this.map.setCenter(bounds.getCenter());
      }
    },

    contextmenu: function (latLng, pixel) {
      var self = this,
        projection,
        contextmenuDir;

      projection = self.map.getProjection();

      self.closeContextmenus();

      jQuery(self.mapDiv).append(self.getContextmenuHtml());

      // Figure out position of context menu
      self.setContextmenuXY(latLng, pixel);

      // Activate buttons in context menu
      self.activateContextMenu();

      // Enable visibility of context menu
      self.displayContextmenu();
    },

    setContextmenuXY: function (latLng, pixel) {
      var self = this;

      var mapWidth = jQuery(self.mapDiv).width(),
        mapHeight = jQuery(self.mapDiv).height(),
        menuWidth = jQuery("." + this.settings.contextmenuClass).width(),
        menuHeight = jQuery("." + this.settings.contextmenuClass).height();

      var x = pixel.x,
        y = pixel.y;

      if (mapWidth - x < menuWidth)
        //if to close to the map border, decrease x position
        x = x - menuWidth;
      if (mapHeight - y < menuHeight)
        //if to close to the map border, decrease y position
        y = y - menuHeight;

      jQuery("." + this.settings.contextmenuClass).css("left", x);
      jQuery("." + this.settings.contextmenuClass).css("top", y);
    },

    getCanvasXY: function (latLng) {
      var self = this;

      var scale = Math.pow(2, self.map.getZoom());
      var nw = new google.maps.LatLng(
        self.map.getBounds().getNorthEast().lat(),
        self.map.getBounds().getSouthWest().lng()
      );
      var worldCoordinateNW = self.map.getProjection().fromLatLngToPoint(nw);
      var worldCoordinate = self.map.getProjection().fromLatLngToPoint(latLng);
      var caurrentLatLngOffset = new google.maps.Point(
        Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
        Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
      );
      return caurrentLatLngOffset;
    },
  });

  // A really lightweight MapMore wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[mapMore] = function (options) {
    return this.each(function () {
      if (!$.data(this, "mapmore_" + mapMore)) {
        $.data(this, "mapmore_" + mapMore, new MapMore(this, options));
      }
    });
  };
})(jQuery, window, document);
