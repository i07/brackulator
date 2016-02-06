/* global brackets, define, window, document, $ */

define(function (require, exports, module) {
    "use strict";
    
    var CommandManager  = brackets.getModule("command/CommandManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        Menus           = brackets.getModule("command/Menus"),
        AppInit         = brackets.getModule("utils/AppInit"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils");
        
    AppInit.appReady(function () {
        
        ExtensionUtils.loadStyleSheet(module, "css/brackulator.css");
        
        var BRACKULATOR_SHOW = "brackulator.show";
        CommandManager.register("Open brackulator", BRACKULATOR_SHOW, braculator.create);

        var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        menu.addMenuItem(BRACKULATOR_SHOW, 'Ctrl-F1');
        
    });
    
    var braculator = {
        
        value : 0,
        memory: 0,
        emptyOnStart: false,
        calctype: '',
        
        create : function() {
            
            if (!document.getElementById('braculator-wrapper')) {
                var div = document.createElement('div');
                div.id = 'braculator-wrapper';

                document.body.appendChild(div);
                
                $('#braculator-wrapper').append(_be.titlebar());
                $('#braculator-wrapper #braculator-titlebar').append('Brackulator v1.0.1');
                $('#braculator-wrapper').append(_be.display);
                $('#braculator-wrapper').append(_be.keypad());
                $('#braculator-wrapper').append(_be.clipboardMessage());

            } else {
                if ($('#braculator-wrapper').css('display') == "none") {
                    braculator.show();
                } else {
                    braculator.hide();    
                }
                
            }
        },
        
        show : function() {
            $('#braculator-wrapper').show();
        },
        hide : function() {
            $('#braculator-wrapper').hide();
        },
        
        destroy : function() {
            document.body.removeChild(document.getElementById('braculator-wrapper'));
        }
    };
    
    var _ut = {
        
        copyToClipboard : function(text) {
            
            if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
                
                var textarea = document.createElement("textarea");
                textarea.textContent = text;
                textarea.style.position = "fixed";
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    return document.execCommand("copy");
                } catch (ex) {
                    //Copy to clipboard failed.
                    return false;
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        },
        
        byID : function(id) {
            return document.getElementById(id);
        },
        
        append : function(obj, id) {
            if (!document.getElementById(id)) {
                document.getElementsByTagName(id)[0].appendChild(obj);
            } else {
                document.getElementById(id).appendChild(obj);
            }
        },
        
        isNumeric : function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
    
        ud : function(e) {
            
            if (braculator.emptyOnStart) {
                $('#braculator-digitDisplay').html('');
                braculator.emptyOnStart = false;
            }
            var val = $('#braculator-digitDisplay').html();
            if ( val == "0" ) { val = ""; }
                
            if (_ut.isNumeric(e.target.value)) {
                var newval;
                newval = val + "" + e.target.value;
                
                $('#braculator-digitDisplay').html(newval);
                braculator.value = parseFloat(newval);
        
            } else {
                
                if (e.target.value === ".") {
                    
                    $('#braculator-digitDisplay').html(val + ".");
                    
                } else if (e.target.value === "=") {
                    
                    switch (braculator.calctype) {
                        case "+":
                            braculator.value = braculator.memory + braculator.value;
                            break;
                        case "-":
                            braculator.value = braculator.memory - braculator.value;
                            break;
                        case "/":
                            braculator.value = braculator.memory / braculator.value;
                            break;
                        case "*":
                            braculator.value = braculator.memory * braculator.value;
                            break;

                    }
                    braculator.calctype = "";
                    braculator.memory = 0;
                    $('#braculator-digitDisplay').html(braculator.value);

                } else {
                    
                    braculator.memory = braculator.value;
                    braculator.value = 0;
                    braculator.emptyOnStart = true;
                    braculator.calctype = e.target.value;
                    
                }
                
            }
        }
    };
    
    var _be = {
        
        clipboardMessage : function() {
            var cpm = document.createElement('div');
            cpm.id='statusMessage';
            cpm.style.textAlign = 'center';
            cpm.style.fontWeight = 'bold';
            cpm.style.display = 'none';
            cpm.innerHTML = "result copied to clipboard";
            
            return cpm;
            
        },
        
        titlebar : function() {
            var titleBar = document.createElement('div');
            titleBar.id = 'braculator-titlebar';
            
            var help = document.createElement('div');
            help.id = "help";
            help.innerHTML = 'double click to clear, right click to copy';
            titleBar.appendChild(help);
            
            return titleBar;
        },
        
        closebutton : function() {
            var closeButton = document.createElement('button');
            closeButton.innerHTML = 'X';
            closeButton.onclick = braculator.hide();
            
            return closeButton;
        },
        
        display : function() {
            var display = document.createElement('div');
            display.id = 'braculator-digitDisplay';
            display.innerHTML = "0";
            display.ondblclick = function() { 
                display.innerHTML = 0;
                $('#statusMessage').html('display cleared');
                $('#statusMessage').fadeIn(100).fadeOut(3000);
            };
            display.oncontextmenu = function(e) {
                
                if (e.shiftKey) {
                    var editor = EditorManager.getCurrentFullEditor();
                    var cursor = editor._codeMirror.getCursor();
                    
                    editor._codeMirror.replaceRange($('#braculator-digitDisplay').html(), cursor, cursor);
                    
                    $('#statusMessage').html('result copied to editor');
                    
                    EditorManager.focusEditor();
                    
                } else {
                    _ut.copyToClipboard($('#braculator-digitDisplay').html());
                    $('#statusMessage').html('result copied to clipboard');
                    $('#statusMessage').fadeIn(100).fadeOut(3000);
                }
                
            };
            
            return display;

        },
        
        keypad : function() {
            var keypadHolder = document.createElement('div');
            keypadHolder.id = 'keypad';
            _ut.append(keypadHolder, 'braculator-wrapper');
            
            var _table = document.createElement('table');
            _ut.append(_table, 'keypad');
            
            var keys = [['7','8','9','/'],['4','5','6','*'],['1','2','3','-'],['0','.','=','+']];
            
            $.each(keys, function(a,b) {
                
                var obj = [];
                
                $.each(b, function(c,d) {
                    obj.push(_be.grid.cell(_be.grid.button(d)));
                });
                
                $('#keypad table').append(_be.grid.row(obj));
            });
            
            return keypadHolder;
            
        },
        
        grid : {
            row : function(objArray) {
                var row = document.createElement('tr');
            
                if (typeof objArray != 'undefined') {
                    $.each(objArray, function(key,obj) {
                        row.appendChild(obj);
                    });
                }
                return row;
            },
            
            cell : function(obj) {
                var cell = document.createElement('td');
            
                if (typeof obj != 'undefined') {
                    cell.appendChild(obj);    
                }

                return cell;
            },
            
            button : function(text) {
                var bt = document.createElement('button');
                bt.innerHTML = text;
                bt.value = text;
                bt.onclick = _ut.ud;

                return bt;
            }
        }
        
    };
    
});