"use strict"

var app = new Vue({
  el: "#main",
  data: {
    showTags: false,
    // workbook information about the target spreadsheet
    workbook: {
      // spreadsheet ID
      id: "1RlKTMMJpDSly_VPH8da4iy1U2E_YJMmDWJxv0UG2Y0Q",
      // The SheetID for the workbook's sheets
      // See http://damolab.blogspot.com/2011/03/od6-and-finding-other-worksheet-ids.html
      // This can be a string OR the numbered position of the tab on the
      // workbook starting with 1 as the left most tab... yeah it's crazy
      sheets: {
        directory: 'ooctsc1',
      }
    },
    filter: {
      skills: {}
    },
    spreadsheet: [],
    cacheLifttime: 0*60*1000, //minutes*60*1000
    loaded: false,
    bgColors: [
      '#EDE9D2',
      '#FFCA00',
      '#FF9D00',
      '#007CCB',
      '#AD1B00',
      '#7FA6CD',
      '#93142E',
      '#3B2E41',
    ]
  },

  /**
   * On creation run method getData
   */
  created: function () {
    this.getData();
  },

  // Vue methods
  methods: {
    /**
     * Loops through this.workbook.sheets to fetch data
     * @return {[type]} [description]
     */
    getData: function () {
      var fresh = new URL(window.location.href).searchParams.get('fresh')

      for ( var i in this.workbook.sheets ) {
        var index = this.workbook.sheets[i];
        // cache based on workbook id
        if ( fresh || ! this.getCache( this.workbook.id, index )) {
          this.fetchData( this.workbook.id, index );
        }
      }
    },
    /**
     * fetches data from google via xhr
     * onload places data into cache
     * @param  {string} id    the spreadsheet ID
     * @param  {string} index the sheet id
     * @return none
     */
    fetchData: function ( id, index ) {
      var xhr = new XMLHttpRequest(),
          self = this,
          url = 'https://spreadsheets.google.com/feeds/list/' + id +  '/' + index + '/public/values?alt=json';
      xhr.open('GET', url )
      xhr.onload = function() {
        console.log('data loaded from xhr');
        self.putData( xhr.responseText, index );
        self.putCache( xhr.responseText, id, index );
      }
      xhr.send(null)
    },
    /**
     * Add's data to vue instance
     * Vue's $set method: https://vuejs.org/v2/api/#vm-set
     * @param  {string} data  the JSON string of data
     * @param  {string} index sheet id
     * @return none - uses vue's $set method to update data
     */
    putData: function ( data, index) {
      this.$set(this.spreadsheet, index, JSON.parse( data ));
      this.loaded = true;
    },
    /**
     * Adds data to local storage cache
     * @param  {string} data  JSON string of data
     * @param  {string} id    spreadsheet id (for identification)
     * @param  {string} index sheet id (for identification)
     * @return none
     */
    putCache: function ( data, id, index ) {
      var identity = id + index;
      window.localStorage.setItem( identity , data );
      console.log('data cached');
    },
    /**
     * gets data from the local storage cache
     * @param  {string} id    spreadsheet id
     * @param  {string} index sheet id
     * @return {bool}         true if data is present, false otherwise
     */
    getCache: function ( id, index ) {
      var identity = id + index;
      if ( window.localStorage.getItem( identity ) && this.cacheIsFresh() ) {
        this.putData( window.localStorage.getItem( identity ), index )
        console.log('data loaded from cache');
        return true;
      }

      return false;

    },
    /**
     * tests for cache "setupTime" and if it is expired
     * if there is no "setupTime" current time is added to local storage
     * see vue data "catchLifetime" for cache timeout
     * @return {bool} true if cache is fresh, false otherwise
     */
    cacheIsFresh: function () {
      var now = new Date().getTime();
      var setupTime = localStorage.getItem('setupTime');
      if (setupTime == null) {
          localStorage.setItem('setupTime', now);
          return false; // cache is NOT fresh
      } else {
          if(now - setupTime > this.cacheLifttime) {
              localStorage.clear()
              localStorage.setItem('setupTime', now);
              console.log('cache reset');
              return false; // cache is NOT fresh
          }
          return true; // cache is fresh
      }
    },
    /**
     * strips the http and www from a url
     * @param  {string} url a full URL for website
     * @return {string}     a url without the http and www
     * @TODO gracefull fail if url is null
     */
    stripHTTP: function ( url ) {
      var regex = new RegExp('(https?://(?:www.)?)','gi');
      return url.replace( regex, '' )
    },
    /**
     * Removes the trailing slash from a string
     * @param  {string} str string ready to have it's slash removed
     * @return {return}     string, now without a slash
     * @TODO gracefull fail if str is null
     */
    stripSlash: function ( str ) {
      return str.replace(/\/$/, "");
    },
    /**
     * Makes a URL pretty to look at
     * @param  {string} url a website url
     * @return {string}     a now pretty to look at url
     */
    prettyLink: function ( url ) {
      return this.stripSlash( this.stripHTTP( url ) );
    },
    /**
     * cleans up links to prevent bad things coming from user input
     * @param  {string} url The raw url
     * @return {string}     the clearned up url, if input is false, pass it through
     */
    sanitizeLink: function ( url ) {

      return (url) ? '//' + this.prettyLink( url ) : url ;
    },
    socialName: function (url,source) {
      url = url.replace(/^(\/\/)/,"");
      switch (source) {
        case 'website':

          break;
        case 'linkedin':
          url = url.replace(/(.*\.com)/,"");
          break;
        case 'facebook':
          url = url.replace(/(.*\.com)/,"");
          break;
        case 'twitter':
          url = url.replace(/(.*\.com\/)/,"@");
          break;
        case 'instagram':
          url = url.replace(/(.*\.com\/)/,"@");
          break;
        default:

      }
      return url;
    },
    getInstagram: function( insta ) {
      if ( insta.url ) {
        return this.socialName( insta.url, 'instagram' );
      } else {
        return null;
      }
    },
    savePNG: function( id, options ) {
      var node = document.getElementById( id );

      node.classList.toggle('rendering');

      domtoimage.toPng(node, options)
        .then(function (dataUrl) {
          var img = new Image();
          img.src = dataUrl;
          document.getElementById( id + '_images' ).prepend(img);
          node.classList.toggle('rendering');
        })
        .catch(function (error) {
          console.error('oops, something went wrong!', error);
        });
    },
    setColor: function( id, color ) {
        var node = document.getElementById( id );
        node.style.backgroundColor = color;
        if ( this.darkText( color ) ) {
          node.classList.add('text-dark');
          node.classList.remove('text-light');
        } else {
          node.classList.add('text-light');
          node.classList.remove('text-dark');
        }
    },
    darkText: function( hex ){

			/*
			From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast

			Color brightness is determined by the following formula:
			((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000

      I know this could be more compact, but I think this is easier to read/explain.

			*/

			var threshold = 130; /* about half of 256. Lower threshold equals more dark text on dark background  */

			var hRed = hexToR(hex);
			var hGreen = hexToG(hex);
			var hBlue = hexToB(hex);


			function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
			function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
			function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
			function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

			var cBrightness = ((hRed * 299) + (hGreen * 587) + (hBlue * 114)) / 1000;
			  if (cBrightness > threshold){return true;} else { return false;}
	  },
    /**
     * Loops through Google Spreadsheet data and returns array of objects
     * constructed from callback
     * @param  {string}   index   the string reference for the workbook sheet
     * @param  {function} action  a function which passes row data and vue object
     * @return {array}            array of row data, false if sheetID doesn't exist
     */
    gsxRowObject: function ( index, action ) {
      if ( this.spreadsheet[index] === undefined ) return false;
      var out  = [],
          rows = this.spreadsheet[index].feed.entry,
          self = this;

      for (var i = 0; i < rows.length; i++) {
        out.push( action( rows[i], self ));
      }

      return out;
    },
    /**
     * Gathers Google Spreadsheet cell data for a particular column
     * @param  {object} row data row from Google Spreadsheet object
     * @param  {string} col name of spreadsheet column to fetch
     * @return {string}     returns cell data, null if cell contains no data
     */
    gsxGetCol: function ( row, col ) {
      var cell = row['gsx$' + col];
      return ( cell && cell.$t ) ? cell.$t : null ;
    },
    toggleFilter: function ( subject, item ) {
      var filter = this.filter[subject];
      if ( filter[item.slug] ) {
        this.$delete(filter, item.slug)
      } else {
        this.$set(filter, item.slug, item)
      }
    }

  },

  watch: {
  },

  computed: {
    /**
     * Generates an edit link to the Google Spreadsheet
     * @return {string} url to spreadsheet
     */
    workbookEditURL: function () {
      return 'https://docs.google.com/spreadsheets/d/' + this.workbook.id + '/edit';
    },
    /**
     * Creates a cleaned up array of row data objects
     * from the freelancer-directory sheets data
     * the string passed into gsxGetCol corrisponds to the column header
     * on the spreadsheet, lower case and without spaces
     * @return {array} array of objects
     */
    people: function () {
      return this.gsxRowObject( this.workbook.sheets.directory , function (r,self) {
            var fullname = self.gsxGetCol( r, 'name'),
                skills = self.gsxGetCol( r, 'otherskills');

                if ( null !== skills ) {
                  skills = skills.trim().replace(/,+\s*$/, '').split(',').map( skill => (
                  {
                    label: skill.trim(),
                    slug: slugify(skill)
                  }) );
                };

            var working =  self.gsxGetCol( r, 'workingon'),
                help =     self.gsxGetCol( r, 'canhelpwith'),
                need =     self.gsxGetCol( r, 'needhelpwith');

          return { //@TODO autmatically return
            filtered: function () {
              // if the filter is empty show
              if ( Object.keys(self.filter.skills).length == 0 ) return true;

              for (var i in this.skills) {
                if (this.skills[i].slug in self.filter.skills) {
                  return true
                }
              }
              return false
            },
            name:     fullname,
            headshot: self.sanitizeLink( self.gsxGetCol( r, 'headshot') ),
            location: self.gsxGetCol( r, 'location'),
            cosmic:   self.gsxGetCol( r, 'cosmictask'),
            trade:    self.gsxGetCol( r, 'primarytrade'),
            skills:   skills,
            working:  self.gsxGetCol( r, 'workingon'),
            help:     self.gsxGetCol( r, 'canhelpwith'),
            need:     self.gsxGetCol( r, 'needhelpwith'),
            links: {
              website:  {
                url: self.sanitizeLink( self.gsxGetCol( r, 'personalwebsite') ),
                label: 'website',
                icon: 'fas fa-home'
              },
              linkedin: {
                url: self.sanitizeLink( self.gsxGetCol( r, 'linkedin') ),
                label: 'linkedin',
                icon: 'fab fa-linkedin'
              },
              facebook: {
                url: self.sanitizeLink( self.gsxGetCol( r, 'facebook') ),
                label: 'facebook',
                icon: 'fab fa-facebook'
              },
              twitter:  {
                url: self.sanitizeLink( self.gsxGetCol( r, 'twitter') ),
                label: 'twitter',
                icon: 'fab fa-twitter'
              },
              instagram:  {
                url: self.sanitizeLink( self.gsxGetCol( r, 'instagram') ),
                label: 'instagram',
                icon: 'fab fa-instagram'
              },
              other:    {
                url: self.sanitizeLink( self.gsxGetCol( r, 'other') ),
                label: 'other',
                icon: 'fas fa-globe-americas'
              }
            },
            primarySite: function () {
              var link = this.links;
              if ( link.website.url )  return link.website;
              if ( link.linkedin.url ) return link.linkedin;
              if ( link.twitter.url )  return link.twitter;
              if ( link.facebook.url ) return link.facebook;
              return false;
            }
          }
        });
    },
    /**
     * Generates skill tags object
     * { tag: { label: [string], slug: [string], count: [int] },... }
     * @return {object} object of tags
     */
    skills: function () {
      var tags = {};
      this.people.forEach( function(p) {
        if ( p.skills ) {
          p.skills.forEach( function(s) {
            if ( tags.hasOwnProperty( s.slug ) ) {
              tags[s.slug].count++;
            } else {
              tags[s.slug] = {
                label: s.label,
                slug: s.slug,
                count: 1
              }
            }
          });
        }
      });
      return tags;
    },
    /**
     * Sorts skills into alphabetical order
     * @return {object} sorted object of skills
     */
    skillsSorted: function () {
      var out = {},
          data = this.skills;

      Object.keys(data)
            .sort()
            .forEach(function(v, i) {
                out[v] = data[v];
             });

      return out;
    },
    /**
     * Filters skills into group that contains certain count
     * @return {object} returns object with 2 values, top & others
     *                  top contains skills with greater than min count
     *                  others contains all other skills
     */
    filteredSkills: function () {
      var out = {},
          min = 4, // minimum occurences of tags
          data = this.skillsSorted;

      Object.keys(data).forEach(key => {
        if ( data[key].count > min) {
          out[key] = data[key];
          delete data[key];
        }
      });

      return { top: out, others: data };
    }
  },
});

function slugify(text){
  return text.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '') // remove non-word [a-z0-9_], non-whitespace, non-hyphen characters
    .replace(/[\s_-]+/g, '_') // swap any length of whitespace, underscore, hyphen characters with a single _
    .replace(/^-+|-+$/g, ''); // remove leading, trailing -
}
