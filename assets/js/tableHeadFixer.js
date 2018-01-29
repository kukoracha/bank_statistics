(function(C){var A=function(Q){var S=Q.rows;var K=S.length;var P=[];for(var I=0;I<K;I++){var R=S[I].cells;var O=R.length;for(var H=0;H<O;H++){var N=R[H];var M=N.rowSpan||1;var J=N.colSpan||1;var L=-1;if(!P[I]){P[I]=[]}var E=P[I];while(E[++L]){}N.realIndex=L;for(var G=I;G<I+M;G++){if(!P[G]){P[G]=[]}var D=P[G];for(var F=L;F<L+J;F++){D[F]=1}}}}};var B=function(H){var E=0,F,D,G=(H.tHead)?H.tHead.rows:0;if(G){for(F=0;F<G.length;F++){G[F].realRIndex=E++}}for(D=0;D<H.tBodies.length;D++){G=H.tBodies[D].rows;if(G){for(F=0;F<G.length;F++){G[F].realRIndex=E++}}}G=(H.tFoot)?H.tFoot.rows:0;if(G){for(F=0;F<G.length;F++){G[F].realRIndex=E++}}};C.fn.tableHover=function(D){var E=C.extend({allowHead:true,allowBody:true,allowFoot:true,headRows:false,bodyRows:true,footRows:false,spanRows:true,headCols:false,bodyCols:true,footCols:false,spanCols:true,ignoreCols:[],headCells:false,bodyCells:true,footCells:false,rowClass:"hover",colClass:"",cellClass:"",clickClass:""},D);return this.each(function(){var N=[],M=[],J=this,F,K=0,O=[-1,-1];if(!J.tBodies||!J.tBodies.length){return }var G=function(U,X){var W,V,T,R,Q,S;for(T=0;T<U.length;T++,K++){V=U[T];for(R=0;R<V.cells.length;R++){W=V.cells[R];if((X=="TBODY"&&E.bodyRows)||(X=="TFOOT"&&E.footRows)||(X=="THEAD"&&E.headRows)){S=W.rowSpan;while(--S>=0){M[K+S].push(W)}}if((X=="TBODY"&&E.bodyCols)||(X=="THEAD"&&E.headCols)||(X=="TFOOT"&&E.footCols)){S=W.colSpan;while(--S>=0){Q=W.realIndex+S;if(C.inArray(Q+1,E.ignoreCols)>-1){break}if(!N[Q]){N[Q]=[]}N[Q].push(W)}}if((X=="TBODY"&&E.allowBody)||(X=="THEAD"&&E.allowHead)||(X=="TFOOT"&&E.allowFoot)){W.thover=true}}}};var L=function(R){var Q=R.target;while(Q!=this&&Q.thover!==true){Q=Q.parentNode}if(Q.thover===true){H(Q,true)}};var I=function(R){var Q=R.target;while(Q!=this&&Q.thover!==true){Q=Q.parentNode}if(Q.thover===true){H(Q,false)}};var P=function(T){var R=T.target;while(R&&R!=J&&!R.thover){R=R.parentNode}if(R.thover&&E.clickClass!=""){var Q=R.realIndex,U=R.parentNode.realRIndex,S="";C("td."+E.clickClass+", th."+E.clickClass,J).removeClass(E.clickClass);if(Q!=O[0]||U!=O[1]){if(E.rowClass!=""){S+=",."+E.rowClass}if(E.colClass!=""){S+=",."+E.colClass}if(E.cellClass!=""){S+=",."+E.cellClass}if(S!=""){C("td, th",J).filter(S.substring(1)).addClass(E.clickClass)}O=[Q,U]}else{O=[-1,-1]}}};var H=function(R,T){if(T){C.fn.tableHoverHover=C.fn.addClass}else{C.fn.tableHoverHover=C.fn.removeClass}var V=N[R.realIndex]||[],S=[],U=0,Q,W;if(E.colClass!=""){while(E.spanCols&&++U<R.colSpan&&N[R.realIndex+U]){V=V.concat(N[R.realIndex+U])}C(V).tableHoverHover(E.colClass)}if(E.rowClass!=""){Q=R.parentNode.realRIndex;if(M[Q]){S=S.concat(M[Q])}U=0;while(E.spanRows&&++U<R.rowSpan){if(M[Q+U]){S=S.concat(M[Q+U])}}C(S).tableHoverHover(E.rowClass)}if(E.cellClass!=""){W=R.parentNode.parentNode.nodeName.toUpperCase();if((W=="TBODY"&&E.bodyCells)||(W=="THEAD"&&E.headCells)||(W=="TFOOT"&&E.footCells)){C(R).tableHoverHover(E.cellClass)}}};A(J);B(J);for(F=0;F<J.rows.length;F++){M[F]=[]}if(J.tHead){G(J.tHead.rows,"THEAD")}for(F=0;F<J.tBodies.length;F++){G(J.tBodies[F].rows,"TBODY")}if(J.tFoot){G(J.tFoot.rows,"TFOOT")}C(this).bind("mouseover",L).bind("mouseout",I).click(P)})}})(jQuery);

(function ($) {

    $.fn.tableHeadFixer = function (param) {

        return this.each(function () {
            table.call(this);
        });

        function table() {
            /*
             This function solver z-index problem in corner cell where fix row and column at the same time,
             set corner cells z-index 1 more then other fixed cells
             */
            function setCorner() {
                var table = $(settings.table);

                if (settings.head) {
                    if (settings.left > 0) {
                        var tr = table.find("thead tr");

                        tr.each(function (k, row) {
                            solverLeftColspan(row, function (cell) {
                                $(cell).css("z-index", settings['z-index'] + 1);
                            });
                        });
                    }

                    if (settings.right > 0) {
                        var tr = table.find("thead tr");

                        tr.each(function (k, row) {
                            solveRightColspan(row, function (cell) {
                                $(cell).css("z-index", settings['z-index'] + 1);
                            });
                        });
                    }
                }

                if (settings.foot) {
                    if (settings.left > 0) {
                        var tr = table.find("tfoot tr");

                        tr.each(function (k, row) {
                            solverLeftColspan(row, function (cell) {
                                $(cell).css("z-index", settings['z-index']);
                            });
                        });
                    }

                    if (settings.right > 0) {
                        var tr = table.find("tfoot tr");

                        tr.each(function (k, row) {
                            solveRightColspan(row, function (cell) {
                                $(cell).css("z-index", settings['z-index']);
                            });
                        });
                    }
                }
            }

            // Set style of table parent
            function setParent() {
                var parent = $(settings.parent);
                var table = $(settings.table);

                parent.append(table);
                parent
                    .css({
                        'overflow-x': 'auto',
                        'overflow-y': 'auto'
                    });

                parent.scroll(function () {
                    var scrollWidth = parent[0].scrollWidth;
                    var clientWidth = parent[0].clientWidth;
                    var scrollHeight = parent[0].scrollHeight;
                    var clientHeight = parent[0].clientHeight;
                    var top = parent.scrollTop();
                    var left = parent.scrollLeft();

                    if (settings.head)
                        this.find("thead tr > *").css("top", top);

                    if (settings.foot)
                        this.find("tfoot tr > *").css("bottom", scrollHeight - clientHeight - top);

                    if (settings.left > 0)
                        settings.leftColumns.css("left", left);

                    if (settings.right > 0)
                        settings.rightColumns.css("right", scrollWidth - clientWidth - left);
                }.bind(table));
            }

            // Set table head fixed
            function fixHead() {
                var thead = $(settings.table).find("thead");
                var tr = thead.find("tr");
                var cells = thead.find("tr > *");

                setBackground(cells);
                cells.css({
                    'position': 'relative'
                });
            }

            // Set table foot fixed
            function fixFoot() {
                var tfoot = $(settings.table).find("tfoot");
                var tr = tfoot.find("tr");
                var cells = tfoot.find("tr > *");

                setBackground(cells);
                cells.css({
                    'position': 'relative'
                });
            }

            // Set table left column fixed
            function fixLeft() {
                var table = $(settings.table);

                // var fixColumn = settings.left;

                settings.leftColumns = $();

                var tr = table.find("tr");
                tr.each(function (k, row) {

                    solverLeftColspan(row, function (cell) {
                        settings.leftColumns = settings.leftColumns.add(cell);
                    });
                    // var inc = 1;

                    // for(var i = 1; i <= fixColumn; i = i + inc) {
                    // 	var nth = inc > 1 ? i - 1 : i;

                    // 	var cell = $(row).find("*:nth-child(" + nth + ")");
                    // 	var colspan = cell.prop("colspan");

                    // 	settings.leftColumns = settings.leftColumns.add(cell);

                    // 	inc = colspan;
                    // }
                });

                var column = settings.leftColumns;

                column.each(function (k, cell) {
                    var cell = $(cell);

                    setBackground(cell);
                    cell.css({
                        'position': 'relative'
                    });
                });
            }

            // Set table right column fixed
            function fixRight() {
                var table = $(settings.table);

                var fixColumn = settings.right;

                settings.rightColumns = $();

                var tr_head = table.find('thead').find("tr");
                var tr_body = table.find('tbody').find("tr");
                var fcell = null;
                tr_head.each(function (k, row) {
                    solveRightColspanHead(row, function (cell) {
                        if (k === 0) {
                            fcell = cell;
                        }
                        settings.rightColumns = settings.rightColumns.add(fcell);
                    });
                });

                tr_body.each(function (k, row) {
                    solveRightColspanBody(row, function (cell) {
                        settings.rightColumns = settings.rightColumns.add(cell);
                    });
                });

                var column = settings.rightColumns;

                column.each(function (k, cell) {
                    var cell = $(cell);

                    setBackground(cell);
                    cell.css({
                        'position': 'relative',
                        'z-index': '9999'
                    });
                });

            }

            // Set fixed cells backgrounds
            function setBackground(elements) {
                elements.each(function (k, element) {
                    var element = $(element);
                    var parent = $(element).parent();

                    var elementBackground = element.css("background-color");
                    elementBackground = (elementBackground == "transparent" || elementBackground == "rgba(0, 0, 0, 0)") ? null : elementBackground;

                    var parentBackground = parent.css("background-color");
                    parentBackground = (parentBackground == "transparent" || parentBackground == "rgba(0, 0, 0, 0)") ? null : parentBackground;

                    var background = parentBackground ? parentBackground : "white";
                    background = elementBackground ? elementBackground : background;

                    element.css("background-color", background);
                });
            }

            function solverLeftColspan(row, action) {
                var fixColumn = settings.left;
                var inc = 1;

                for (var i = 1; i <= fixColumn; i = i + inc) {
                    var nth = inc > 1 ? i - 1 : i;

                    var cell = $(row).find("> *:nth-child(" + nth + ")");
                    var colspan = cell.prop("colspan");

                    if (cell.cellPos().left < fixColumn) {
                        action(cell);
                    }

                    inc = colspan;
                }
            }

            function solveRightColspanHead(row, action) {
                var fixColumn = settings.right;
                var inc = 1;
                for (var i = 1; i <= fixColumn; i = i + inc) {
                    var nth = inc > 1 ? i - 1 : i;

                    var cell = $(row).find("> *:nth-last-child(" + nth + ")");
                    var colspan = cell.prop("colspan");

                    action(cell);

                    inc = colspan;
                }
            }

            function solveRightColspanBody(row, action) {
                var fixColumn = settings.right;
                var inc = 1;
                for (var i = 1; i <= fixColumn; i = i + inc) {
                    var nth = inc > 1 ? i - 1 : i;

                    var cell = $(row).find("> *:nth-last-child(" + nth + ")");
                    var colspan = cell.prop("colspan");
                    action(cell);
                    inc = colspan;
                }
            }

            var defaults = {
                head: true,
                foot: false,
                left: 0,
                right: 0,
                'z-index': 0
            };

            var settings = $.extend({}, defaults, param);

            settings.table = this;
            settings.parent = $(settings.table).parent();
            setParent();

            if (settings.head == true) {
                fixHead();
            }

            if (settings.foot == true) {
                fixFoot();
            }

            if (settings.left > 0) {
                fixLeft();
            }

            if (settings.right > 0) {
                fixRight();
            }

            setCorner();

            $(settings.parent).trigger("scroll");

            $(window).resize(function () {
                $(settings.parent).trigger("scroll");
            });
        }
    };

})(jQuery);

/*  cellPos jQuery plugin
 ---------------------
 Get visual position of cell in HTML table (or its block like thead).
 Return value is object with "top" and "left" properties set to row and column index of top-left cell corner.
 Example of use:
 $("#myTable tbody td").each(function(){
 $(this).text( $(this).cellPos().top +", "+ $(this).cellPos().left );
 });
 */
(function ($) {
    /* scan individual table and set "cellPos" data in the form { left: x-coord, top: y-coord } */
    function scanTable($table) {
        var m = [];
        $table.children("tr").each(function (y, row) {
            $(row).children("td, th").each(function (x, cell) {
                var $cell = $(cell),
                    cspan = $cell.attr("colspan") | 0,
                    rspan = $cell.attr("rowspan") | 0,
                    tx, ty;
                cspan = cspan ? cspan : 1;
                rspan = rspan ? rspan : 1;
                for (; m[y] && m[y][x]; ++x);  //skip already occupied cells in current row
                for (tx = x; tx < x + cspan; ++tx) {  //mark matrix elements occupied by current cell with true
                    for (ty = y; ty < y + rspan; ++ty) {
                        if (!m[ty]) {  //fill missing rows
                            m[ty] = [];
                        }
                        m[ty][tx] = true;
                    }
                }
                var pos = {top: y, left: x};
                $cell.data("cellPos", pos);
            });
        });
    };

    /* plugin */
    $.fn.cellPos = function (rescan) {
        var $cell = this.first(),
            pos = $cell.data("cellPos");
        if (!pos || rescan) {
            var $table = $cell.closest("table, thead, tbody, tfoot");
            scanTable($table);
        }
        pos = $cell.data("cellPos");
        return pos;
    }
})(jQuery);