
angular.module("mm.foundation.topbar", [])
    .run(['$window', '$document', function($window, $document) { // provider-injector

        // Polyfil matchesSelector
        // Source: https://gist.github.com/jonathantneal/3062955
        ($window.Element && function(ElementPrototype) {
            ElementPrototype.matchesSelector = ElementPrototype.matchesSelector || 
            ElementPrototype.mozMatchesSelector ||
            ElementPrototype.msMatchesSelector ||
            ElementPrototype.oMatchesSelector ||
            ElementPrototype.webkitMatchesSelector ||
            function (selector) {
                var node = this;
                var nodes = (node.parentNode || node.document).querySelectorAll(selector);
                var i = -1;
         
                while (nodes[++i] && nodes[i] != node){}
         
                return !!nodes[i];
            };
        })(Element.prototype);

        // Polyfill matchMedia for IE < 9
        $window.matchMedia = $window.matchMedia || (function( doc, undefined ) {

            var bool,
                docElem = doc.documentElement,
                refNode = docElem.firstElementChild || docElem.firstChild,
                // fakeBody required for <FF4 when executed in <head>
                fakeBody = doc.createElement( "body" ),
                div = doc.createElement( "div" );

            div.id = "mq-test-1";
            div.style.cssText = "position:absolute;top:-100em";
            fakeBody.style.background = "none";
            fakeBody.appendChild(div);

            return function (q) {
                div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

                docElem.insertBefore( fakeBody, refNode );
                bool = div.offsetWidth === 42;
                docElem.removeChild( fakeBody );

                return {
                    matches: bool,
                    media: q
                };

            };

        }( $document[0] ));

        // Looks up the tree for an element matching the selector
        $window.closest = function(el, selector) {
            var element = el[0];
            while (element) {
                if (element.matchesSelector(selector)) {
                    return angular.element(element);
                } else {
                    element = element.parentElement;
                }
            }
            return false;
        };

    }])
    .directive('topBar', ['$timeout','$compile', '$window', '$document',
        function ($timeout, $compile, $window, $document) {
        
        var win = angular.element($window);
        var head = angular.element($document[0].querySelector('head'));
        
        head.append('<meta class="foundation-mq-topbar" />');
        head.append('<meta class="foundation-mq-small" />');
        head.append('<meta class="foundation-mq-medium" />');
        head.append('<meta class="foundation-mq-large" />');

        return {
            scope: {
                "options": "=",
            },
            restrict: 'C',
            link: function ($scope, element, attrs) {
                var settings = $scope.settings;
                var topbar = $scope.topbar = element;
                var topbarContainer = topbar.parent();
                var media_queries = $scope.media_queries = {
                    topbar: getComputedStyle(head[0].querySelector('meta.foundation-mq-topbar')).fontFamily.replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
                    small : getComputedStyle(head[0].querySelector('meta.foundation-mq-small')).fontFamily.replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
                    medium : getComputedStyle(head[0].querySelector('meta.foundation-mq-medium')).fontFamily.replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
                    large : getComputedStyle(head[0].querySelector('meta.foundation-mq-large')).fontFamily.replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, '')
                };
                var body = angular.element($document[0].querySelector('body'));


                var is_sticky = $scope.is_sticky = function () {
                    var sticky = topbarContainer.hasClass(settings.sticky_class);
                    if (sticky && settings.sticky_on === 'all') {
                        return true;
                    } else if (sticky && small() && settings.sticky_on === 'small') {
                        return true;
                    } else if (sticky && medium() && settings.sticky_on === 'medium') {
                        return true;
                    } else if (sticky && large() && settings.sticky_on === 'large') {
                        return true;
                    }
                    return false;
                };

                var update_sticky_positioning = function(){
                    if (!settings.sticky_topbar || !$scope.is_sticky()) {
                        return;
                    }
                    
                    var $class = angular.element($document[0].querySelector('.' + settings.sticky_class));

                    var distance = stickyoffset;
                    if (true) {
                        if (win.scrollTop() > (distance)) {
                            if (!$class.hasClass('fixed')) {
                                $class.addClass('fixed');
                                body.addClass('f-topbar-fixed');
                            }
                        } else if (win.scrollTop() <= distance) {
                            if ($class.hasClass('fixed')) {
                                $class.removeClass('fixed');
                                body.removeClass('f-topbar-fixed');
                            }
                        }
                    }  
                };

                $scope.toggle = function(on) {
                    if(!$scope.breakpoint()){
                        return false;
                    }
                    
                    if(on === undefined){
                        topbar.toggleClass('expanded');
                    }
                    else if (on === true){
                        topbar.addClass('expanded');
                    }
                    else if (on === false){
                        topbar.removeClass('expanded');
                    }

                    if (settings.scrolltop) {
                        if (!topbar.hasClass('expanded')) {
                            if (topbar.hasClass('fixed')) {
                                topbar.parent().addClass('fixed');
                                topbar.removeClass('fixed');
                                body.addClass('f-topbar-fixed');
                            }
                        } else if (topbar.parent().hasClass('fixed')) {
                            topbar.parent().removeClass('fixed');
                            topbar.addClass('fixed');
                            body.removeClass('f-topbar-fixed');
                            $window.scrollTo(0,0);
                        }
                    } else {
                        if(is_sticky()) {
                            topbar.parent().addClass('fixed');
                        }

                        if(topbar.parent().hasClass('fixed')) {
                            if (!topbar.hasClass('expanded')) {
                                topbar.removeClass('fixed');
                                topbar.parent().removeClass('expanded');
                                update_sticky_positioning();
                            } else {
                                topbar.addClass('fixed');
                                topbar.parent().addClass('expanded');
                                body.addClass('f-topbar-fixed');
                            }
                        }
                    }
                };

                if(topbarContainer.hasClass('fixed') || is_sticky() ) {
                    settings.sticky_class = settings.sticky_class;
                    settings.sticky_topbar = true;
                    $scope.height = topbarContainer[0].offsetHeight;
                    var stickyoffset = topbarContainer[0].getBoundingClientRect().top;
                } else {
                    $scope.height = topbar[0].offsetHeight;
                }

                $scope.original_height = $scope.height;

                $scope.$watch('height', function(h){
                    if(h){
                        topbar.css('height', h + 'px');
                    } else {
                        topbar.css('height', '');
                    }
                });
                
                // Pad body when sticky (scrolled) or fixed.
                head.append('<style>.f-topbar-fixed { padding-top: ' + $scope.original_height + 'px }</style>');

                win.bind('resize', function(){
                    var sections = angular.element(topbar[0].querySelectorAll('section'));
                    angular.forEach(sections, function(section){
                        angular.element(section.querySelectorAll('li.moved')).removeClass('moved');
                    });
                    topbar.removeClass('expanded');
                    $scope.height = '';
                    $scope.$apply();
                });

                // update sticky positioning
                win.bind("scroll", function() {
                    update_sticky_positioning();
                    $scope.$apply();
                });

                $scope.$on('$destroy', function(){
                    win.unbind("scroll");
                    win.unbind("resize");
                });

                if (topbarContainer.hasClass('fixed')) {
                    body.addClass('f-topbar-fixed');
                }
            },
            controller: ['$window', '$scope', function($window, $scope) {
                
                var settings = {
                    sticky_class : 'sticky',
                    custom_back_text: true,
                    back_text: 'Back',
                    is_hover: true,
                    mobile_show_parent_link: true,
                    scrolltop : true, // jump to top when sticky nav menu toggle is clicked
                    sticky_on : 'all'
                };

                angular.extend(settings, $scope.options);
                this.settings = $scope.settings = settings;
                $scope.index = 0;

                var outerHeight = function(el){
                    var height = el.offsetHeight;
                    var style = el.currentStyle || getComputedStyle(el);

                    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
                    return height;
                };

                var breakpoint = $scope.breakpoint = this.breakpoint = function () {
                    return !$window.matchMedia($scope.media_queries.topbar).matches;
                };

                var small = function () {
                    return $window.matchMedia($scope.media_queries.small).matches;
                };

                var medium = function () {
                    return $window.matchMedia($scope.media_queries.medium).matches;
                };

                var large = function () {
                    return $window.matchMedia($scope.media_queries.large).matches;
                };

                var sections = [];

                this.addSection = function(section){
                    sections.push(section);
                };

                this.removeSection = function(section){
                    var index = sections.indexOf(section);
                    if (index > -1) {
                        sections.splice(index, 1);
                    }
                };

                var dir = /rtl/i.test($document.find('html').attr('dir')) ? 'right' : 'left';

                $scope.$watch('index', function(index){
                    for(var i = 0; i < sections.length; i++){
                        sections[i].move(dir, index);
                    }
                });

                this.toggle = function(){
                    for(var i = 0; i < sections.length; i++){
                        sections[i].reset();
                    }
                    $scope.index = 0;
                    $scope.height = '';
                    $scope.toggle();
                    $scope.$apply();
                };

                this.back = function(event) {
                    if($scope.index < 1 || !breakpoint()){
                        return;
                    }
                    
                    var $link = angular.element(event.currentTarget);
                    var $movedLi = closest($link, 'li.moved');
                    var $previousLevelUl = $movedLi.parent();
                    $scope.index = $scope.index -1;

                    if($scope.index === 0){
                        $scope.height = '';
                    } else {
                        $scope.height = $scope.original_height + outerHeight($previousLevelUl[0]);
                    }

                    $timeout(function () {
                        $movedLi.removeClass('moved');
                    }, 300);
                };

                this.forward = function(event) {
                    if(!breakpoint()){
                        return false;
                    }

                    var $link = angular.element(event.currentTarget);
                    var $selectedLi = closest($link, 'li');
                    $selectedLi.addClass('moved');
                    $scope.height = $scope.original_height + outerHeight($link.parent()[0].querySelector('ul'));
                    $scope.index = $scope.index + 1;
                };

            }]
        };
    }])
    .directive('toggleTopbar', [function () {
        return {
            scope: {},
            require: '^topBar',
            restrict: 'C',
            link: function ($scope, element, attrs, topBar) {
                element.bind('click', function(event) {
                    var li = closest(angular.element(event.currentTarget), 'li');
                    if(!li.hasClass('back') && !li.hasClass('has-dropdown')) {
                        topBar.toggle();
                    }
                });

                $scope.$on('$destroy', function(){
                    element.unbind('click');
                });
            }
        };
    }])
    .directive('topBarSection', ['$compile', function ($compile) {
        return {
            scope: {},
            require: '^topBar',
            restrict: 'C',
            link: function ($scope, element, attrs, topBar) {
                var section = element;
                
                $scope.reset = function(){
                    angular.element(section[0].querySelectorAll('li.moved')).removeClass('moved');
                };

                $scope.move = function(dir, index){
                    if(dir === 'left'){
                        section.css({"left": index * -100 + '%'});
                    }
                    else {
                        section.css({"right": index * -100 + '%'});
                    }
                };

                topBar.addSection($scope);

                $scope.$on("$destroy", function(){
                    topBar.removeSection($scope);
                });

                // Top level links close menu on click
                var links = section[0].querySelectorAll('li>a');
                angular.forEach(links, function(link){
                    var $link = angular.element(link);
                    var li = closest($link, 'li');
                    if(li.hasClass('has-dropdown') || li.hasClass('back') || li.hasClass('title')){
                        return;
                    }

                    $link.bind('click', function(){
                        topBar.toggle(false);
                    });

                    $scope.$on('$destroy', function(){
                        $link.bind('click');
                    });
                });

            },
            controller: ['$window', '$scope', function($window, $scope) {
                var dropdowns = [];

                this.addDropdown = function(dropdown){
                    dropdowns.push(dropdown);
                };

                this.removeDropdown = function(section){
                    var index = dropdowns.indexOf(section);
                    if (index > -1) {
                        dropdowns.splice(index, 1);
                    }
                };

            }]
        };
    }])
    .directive('hasDropdown', [function () {
        return {
            scope: {},
            require: ['^topBar', '^topBarSection'],
            restrict: 'C',
            link: function ($scope, element, attrs, ctrls) {
                var topBar = ctrls[0];
                var topBarSection = ctrls[1];

                $scope.trigger_link = element.children('a')[0];

                var $link = angular.element($scope.trigger_link);

                $link.bind('click', function(event){
                    topBar.forward(event);
                });
                $scope.$on('$destroy', function(){
                    $link.unbind('click');
                });

                topBarSection.addDropdown($scope);

                element.bind('mouseenter', function() {
                    if(topBar.settings.is_hover && !topBar.breakpoint()){
                        element.addClass('not-click');
                    }
                });
                element.bind('click', function(event) {
                    if(!topBar.settings.is_hover && !topBar.breakpoint()){
                        element.toggleClass('not-click');
                    }
                });
                
                element.bind('mouseleave', function() {
                    element.removeClass('not-click');
                });

                $scope.$on('$destroy', function(){
                    element.unbind('click');
                    element.unbind('mouseenter');
                    element.unbind('mouseleave');
                    topBarSection.removeDropdown($scope);
                });
            },
            controller: ['$window', '$scope', function($window, $scope) {
                this.trigger_link = $scope.trigger_link;
            }]
        };
    }])
    .directive('dropdown', ['$compile', function ($compile) {
        return {
            scope: {},
            require: ['^topBar', '^topBarSection', '^hasDropdown'],
            restrict: 'C',
            link: function ($scope, element, attrs, ctrls) {

                // Lower level links close menu on click
                var links = element[0].querySelectorAll('li>a');
                angular.forEach(links, function(link){
                    var $link = angular.element(link);
                    var li = closest($link, 'li');
                    if(li.hasClass('has-dropdown') || li.hasClass('back') || li.hasClass('title')){
                        return;
                    }

                    $link.bind('click', function(){
                        topBar.toggle(false);
                    });

                    $scope.$on('$destroy', function(){
                        $link.bind('click');
                    });
                });

                var topBar = ctrls[0];
                var topBarSection = ctrls[1];
                var hasDropdown = ctrls[2];

                var $link = angular.element(hasDropdown.trigger_link);
                var url = $link.attr('href');

                $scope.link_text = $link.text();

                $scope.back = function(event){
                    topBar.back(event);
                };

                // Add back link
                if (topBar.settings.custom_back_text === true) {
                    $scope.back_text = topBar.settings.back_text;
                } else {
                    $scope.back_text = '&laquo; ' + $link.html();
                }

                var $titleLi;
                if (topBar.settings.mobile_show_parent_link && url && url.length > 1) {
                    $titleLi = angular.element('<li class="title back js-generated">' +
                        '<h5><a href="#" ng-click="back($event);">{{back_text}}</a></h5></li>' +
                        '<li><a class="parent-link js-generated" href="' +
                        url + '">{{link_text}}</a></li>');
                } else {
                    $titleLi = angular.element('<li class="title back js-generated">' +
                        '<h5><a href="" ng-click="back($event);">{{back_text}}</a></h5></li>');
                }

                $compile($titleLi)($scope);
                element.prepend($titleLi);

            }
        };
    }]);