function updateExpanders(){
    $('tr[id*=content-node-] > td > span[class=expander]').css({'display': 'none'});
    var reg = new RegExp("child-of-content-node-\\d+");
    jQuery.each($('tr[class*=child-of-content-node-][id!=]'), function(index, value){
      var id = /\d+/.exec(value.className.match(reg)[0]);
      $("#content-node-" + id + " > td > span[class=expander]").css({'display':''});
    });
}

function loadPage(url) {
    window.location.reload(true);
    window.location.href = url
}

function changeSpace() {
    var sel = $('#spaceSelector').get(0)
    var spacename = sel.options[sel.selectedIndex].text
    loadPage(resources["link.treetable"] + "?space=" + spacename)
}

/**
 * Get the node ids of all currently selected nodes
 */
function getSelectedNodeIds() {
    var nodeIds = $.map( $('tr.selected'), function (item, idx) {
        var idattr = $(item).attr('id')
        var id = /\d+/.exec(idattr)
        return id
    })
    return nodeIds
}

function resetInserters(){
    $("tr[class*=inserter]").css({'display': 'none'});
}

function viewSelected() {
    var nodes = getSelectedNodeIds()
    if (nodes.length == 0) {
        window.alert('You must select a node first')
        return
    }
    var node = nodes[0]
    loadPage(resources["link.preview"]+"/"+node)
}

function deleteSelected() {
    var nodes = getSelectedNodeIds()
    if (nodes.length == 0) {
        window.alert('You must select a node first')
        return
    }
    var node = nodes[0]
    var title = $('#content-node-'+node+' h2.title').text() 
    $('#deleteContentNodeTitle').text(title)
	$('#deleteDialog').dialog('open')
}

function moveToSelected() {
    window.alert('Moving to another space is not implemented yet')
}

function duplicateSelected() {
    window.alert('Duplicate is not implemented yet')
}

function toggleStyle(element, neighbour){
    var reg = new RegExp("child-of-content-node-\\d+");
    var parentClass = null;
    if ($(neighbour).attr('class').match(reg) != null){
        parentClass = neighbour.attr('class').match(reg)[0];
    }
    if ($(element).attr('class').match(reg) != null){
        element.removeClass(element.attr('class').match(reg)[0]);
    }
    if (parentClass != null){
        element.addClass(parentClass);
    }
    var newstyle = $("#" + $(neighbour).attr('id') + " > td:first").attr('style');
    if (newstyle == null) newstyle = "";
    $("#" + $(element).attr('id') + " > td:first").attr("style", newstyle);
    return parentClass != null ? /\d+/.exec(parentClass)[0] : null;
}

function getParentId(element){
    var reg = new RegExp("child-of-content-node-\\d+");
    if ($(element).attr('class').match(reg) != null){
        return /\d+/.exec($(element).attr('class').match(reg)[0]);
    }else{
        return null;
    }
}



var draggableConf = {
        helper: "clone",
        opacity: .75,
        refreshPositions: true, // Performance?
        revert: "invalid",
        revertDuration: 300,
        scroll: true
    }

var droppableConf = {
        accept: ".title",
        drop: function(e, ui) { 
            // Call jQuery treeTable plugin to move the branch
            if ((this.id != "") &&
                (this.id != "empty-field")) {
                var el = $("#" + this.id);
                if (el.is(".inserter-before") || el.is(".inserter-after")){
                    var movable = $($(ui.draggable).parents("tr")[0]);
                    var newindex = $("#content-node-" + /\d+/.exec(el.attr('id')) + " > td:first > a > h2.title").attr("orderindex");
                    if (el.is(".inserter-before")){
                        newindex = (newindex == 0) ? newindex : newindex - 1;
                    }
                    // @todo clean this up - slow to keep getting the node!
                    $('#confirmDialog').dialog('option', 'index', newindex);
                    $('#confirmDialog').dialog('option', 'switch', el.is('.inserter-before') ? 'before' : 'after');
                    $('#confirmDialog').dialog('option', 'source', movable);
                    $('#confirmDialog').dialog('option', 'target', el);
                    $('#confirmDialog').dialog('open');
                }else{
                    var type = $("#" + this.id + " > td > a > h2.title").attr("type");
                    if (resources["haveChildren"][type]){
                        var children = $(".child-of-content-node-" + /\d+/.exec(this.id) + "[id*=content-node-] > td > a > h2.title")
                        var newindex = 0;
                        jQuery.each(children, function(index, value){
                            if ($(value).attr('orderindex') > newindex){
                                newindex = $(value).attr('orderindex');
                            }
                        });
                        // @todo clean this up - slow to keep getting the node!
                        $('#confirmDialog').dialog('option', 'index', ++newindex);
                        $('#confirmDialog').dialog('option', 'switch', 'in');
                        $('#confirmDialog').dialog('option', 'source', $(ui.draggable).parents("tr")[0]);
                        $('#confirmDialog').dialog('option', 'target', this);
                        $('#confirmDialog').dialog('open');
                    }
                }
            }
            resetInserters();
        },
        hoverClass: "accept",
        over: function(e, ui) {
          // Make the droppable branch expand when a draggable node is moved over it.
          if(this.id != ui.draggable.parents("tr")[0].id && !$(this).is(".expanded")) {
            $(this).expand();
          }
          var itemId = /\d+/.exec(this.id);
          resetInserters();
          $("#inserter-before-"+itemId).css({'display': ''});
          $("#inserter-after-"+itemId).css({'display': ''});
        }
}

function removeNode(id) {
    $('#content-node-'+id).slideUp('slow', function () { 
        $(this).remove() 
        $('.child-of-content-node-'+id).remove()
    })
}

/*--------------------------------------------*/
function initTreeTable() {
    // Handle selection of rows with click
    jQuery.each($('tr[id*=content-node-]'), function(index, value){
        $(value)[0].onclick = function(){
            var clickedNode = $($(value)[0])
            var rowNodes = $('tr[id*=content-node-]')
            var wasSel = clickedNode.hasClass('selected')
            $('tr[id*=content-node-]').removeClass('selected');
            if (!wasSel) {
                clickedNode.addClass('selected');
            }
        }
    });
  	$("#treeTable").treeTable({indent: 25});
  	$("span.expander").click(function (){resetInserters()});
    resetInserters();
    updateExpanders();
    
    $('.title').draggable(draggableConf)
    
    $('.title').each(function() {
        $(this).parents("tr").droppable(droppableConf)
        });
    
	$('.ui-icon-info').click( function() { 
		var icon = $(this)
		var p = icon.parent()
		var i = icon.text()
		var dlg = $('#infoDialog'+i)
		dlg.dialog('open')
	})
	$('#deleteDialog').dialog( {
		autoOpen: false, 
		buttons: { 
			Yes: function () { 
			    $(this).dialog('close'); 
			    var nodeId = getSelectedNodeIds()[0]
                $.post(resources["link.deletenode"], 
                    {id: nodeId},
                    function(data) {
            		    if (data) {
            		        if (data.status == 403){
            		            $('#expiredDialog').dialog('open');
            		        } else
        		            if (data.result != 'success') {
        		                window.alert("Delete failed: "+data.error)
        		            } else {
        		                removeNode(nodeId)
        		            }
        		        }
                    }, 'json')
			}, 
			No: function () { 
			    $(this).dialog('close') 
			} 
		}
	})
	$('.ui-icon-circle-minus').click( function() { 
        deleteSelected()
	})
	
	$('#createNewDialog').dialog({
	    autoOpen: false,
	    modal: true,
	    buttons: {
	        Create : function () {
	            var parentid = getSelectedNodeIds()
	            $("#parentid").attr("value", parentid)
	            $('#createNewDialog form').submit()
	            $(this).dialog('close')
	        },
	        Cancel : function () {
	            $(this).dialog('close')
	        }
	    }
	})
	
	$('button.createNew').click( function() {
	    $('#createNewDialog').dialog('open')
	})
	
    var moreActionsMenu = $('#moreActionsMenu').html()
    
	$('.moreActions').each( function () {
	    $(this).menu({
		    content: moreActionsMenu,		
		    flyOut: true,
		    itemSelected: function(node) {
		        if ($(node).hasClass('deleteAction')) {
		            deleteSelected()
		        } else if ($(node).hasClass('viewAction')) {
		            viewSelected()
		        } else if ($(node).hasClass('moveToSpaceAction')) {
		            moveToSelected()
		        } else if ($(node).hasClass('duplicateAction')) {
		            duplicateSelected()
		        }
		    }
	    })
	})
	
	$("#expiredDialog").dialog({
        autoOpen: false,
        modal: true,
        buttons: { "Ok" : function(){$(this).dialog('close');}}
    });
    
	$('#confirmDialog').dialog({
	    autoOpen: false,
	    modal: true,
	    buttons: {
	        "Cancel" : function(){$(this).dialog('close');},
	        "Move" : function(){
	            var index = $(this).dialog('option', 'index');
	            var swc = $(this).dialog('option', 'switch');
	            var src = $(this).dialog('option', 'source');
	            var trg = $(this).dialog('option', 'target');
	            var parentId = getParentId(trg);
	            var inserterAfter = $("#inserter-after-" + /\d+/.exec($(src).attr('id'))[0]);
                var inserterBefore = $("#inserter-before-" + /\d+/.exec($(src).attr('id'))[0]);
                var tid = (swc == "in") ? /\d+/.exec($(trg).attr('id')) : (parentId == null ? -1 : parentId)
                $.post(resources["link.movenode"],
                    {sourceId: /\d+/.exec($(src).attr('id')), targetId: tid, index: index},
                    function (data){
                        var response = eval('(' + data + ')');
                        if (response['status'] == 403){
    	                    $('#expiredDialog').dialog('open');
    	                    return ;
        	            }
    	                if (response['result'] == "failure"){
    	                    alert(response['error']);
    	                }else{
    	                    switch(swc){
    	                        case 'in':
        	                        $(src).appendBranchTo(trg);
        	                        break;
        	                    case 'before':
        	                        toggleStyle(src, $(trg));
                                    src.insertBefore("#" + $(trg).attr('id'));
                                    break;
                                case 'after':
                                    toggleStyle(src, $(trg));
                                    src.insertAfter("#" + $(trg).attr('id'));
                                    break;
    	                    }
    	                    toggleStyle(inserterBefore, $(src));
                            toggleStyle(inserterAfter, $(src));
                            inserterAfter.insertAfter("#" + $(src).attr('id'));
                            inserterBefore.insertBefore("#" + $(src).attr('id'));
                            var indexes = response['indexes'];
                            jQuery.each(indexes, function(key, val){
                               $("#content-node-" + key + " > td:first > a >h2.title").attr('orderindex', val);
                            });
                            updateExpanders();
                            resetInserters();
    	                }
	                }
                );
	            $(this).dialog('close');
	        },
	        "Virtual Copy" : function(){
	            var index = $(this).dialog('option', 'index');
	            var swc = $(this).dialog('option', 'switch');
	            var src = $(this).dialog('option', 'source');
	            var trg = $(this).dialog('option', 'target');
	            var parentId = getParentId(trg);
	            var tid = (swc == "in") ? /\d+/.exec($(trg).attr('id')) : (parentId == null ? -1 : parentId)
	            var inserterAfter = $("#inserter-after-" + /\d+/.exec($(src).attr('id'))[0]).clone();
                var inserterBefore = $("#inserter-before-" + /\d+/.exec($(src).attr('id'))[0]).clone();
                inserterAfter.droppable(droppableConf);
                inserterBefore.droppable(droppableConf);
                $.post(resources["link.copynode"],
        	            {sourceId: /\d+/.exec($(src).attr('id')), targetId: tid, index: index},
        	            function (data){
        	                var response = eval('(' + data + ')');
        	                if (response['status'] == 403){
        	                    $('#expiredDialog').dialog('open');
        	                    return ;
        	                }
        	                if (response['result'] == "failure"){
        	                    alert(response['error']);
        	                }else{
        	                    var srcCopy = $(src).clone();
        	                    $(inserterAfter).attr('id', 'inserter-after-' + response['id']);
        	                    $(inserterBefore).attr('id', 'inserter-before-' + response['id']);
        	                    $(srcCopy).attr('id', 'content-node-' + response['id']);
        	                    switch (swc){
        	                        case 'in':
        	                            $(srcCopy).appendBranchTo(trg);
                                        break;
                                    case 'before':
                                        srcCopy.insertBefore("#" + trg.attr('id'));
                                        toggleStyle($(srcCopy), trg);
                                        break;
                                    case 'after':
                                        srcCopy.insertAfter("#" + trg.attr('id'));
                                        toggleStyle($(srcCopy), trg);
                                        break;
        	                    }
        	                    $('#' + srcCopy.attr('id') + ' > td > a > h2.title').draggable(draggableConf);
        	                    $('#' + srcCopy.attr('id') + ' > td > a > h2.title').attr('type', response['ctype']);
        	                    srcCopy.droppable(droppableConf);
        	                    $('#' + srcCopy.attr('id') + ' > td > a > span.type').html(' (Virtual Content)');
        	                    inserterAfter.insertAfter("#" + srcCopy.attr('id'));
        	                    inserterBefore.insertBefore("#" + srcCopy.attr('id'));
                                toggleStyle($(inserterBefore), $(srcCopy));
                                toggleStyle($(inserterAfter), $(srcCopy));
                                var indexes = response['indexes'];
                                jQuery.each(indexes, function(key, val){
                                   $("#content-node-" + key + " > td:first > a >h2.title").attr('orderindex', val);
                                });
        	                    resetInserters();
        	                    updateExpanders();
        	                }
        	            });
    	        $(this).dialog('close');
	        }
	    }
	})

}
