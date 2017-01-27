(function (Drupal, drupalSettings, $) {
  Drupal.behaviors.liveblogEmbed = {
    attach: function (context, settings) {
      var $context = $(context)


      $context.find('form.liveblog-post-form')
        .once('liveblog-embed-initialised')
        .each(function (index, element) {
          var $el = $(element)
          var instance = $el.find('.field--name-body textarea')
          var id = instance.attr('id')

          // Prepare embed preview
          var embedWrapper = $el.find('.field--name-field-embed-url').hide()
          var embedField = embedWrapper.find('input#edit-field-embed-url-0-uri') // TODO: Will this work on edit?
          var embedPreview = $('<div class="liveblog-embed--preview">' +
            '<label>Embed Preview</label>' + // TODO translate
            '<div class="liveblog-embed--preview--overlay"></div> ' +
            '<div class="liveblog-embed--preview--content"></div> ' +
            '</div>').insertAfter(embedWrapper)

          var embedHeight = embedPreview.height()
          embedPreview.find('.liveblog-embed--preview--overlay').click(function(e) {
            if (!embedPreview.hasClass('open')) {
              embedPreview.animate({height: embedPreview.get(0).scrollHeight}, function () {
                embedPreview.addClass('open')
              })
            }
            else {
              embedPreview.animate({height: embedHeight}, function() {
                embedPreview.removeClass('open')
              })
            }
          })

          // Handle ckeditor
          if (Object.keys(CKEDITOR.instances).length == 0) {
            var listener = function (e) {
              if (e.editor.name == id) {
                _patchCKEditor(id)
                CKEDITOR.removeListener('instanceReady', listener)
              }
            }
            CKEDITOR.on('instanceReady', listener)
          }
          else {
            _patchCKEditor(id)
          }

          // Fallback for simple textareas
          instance.on('input', function (e) {
            _checkForURL(instance.val())
          })

          function _patchCKEditor(id) {
            CKEDITOR.instances[id].on('change', function () {
              var data = CKEDITOR.instances[id].getData()
              _checkForURL(data)
            });
            // We could also get the data directly: CKEDITOR.instances[id].getData()
          }


          function _checkForURL(text) {
            var linkMatch = /(?:^|\s|>)(https?:\/\/(?:www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%._\+~#=?&\/])*)(?:$|\s|<)/gi.exec(text)
            if (linkMatch && linkMatch[1]) {
              if (linkMatch[1] != embedField.val()) {
                embedField.val(linkMatch[1])
                _updateEmbedPreview(linkMatch[1])
              }
            }
          }

          function _updateEmbedPreview(url) {
            $.get('/liveblog/embed?url=' + url, function (data) {
              var assetHdl = new drupalSettings.liveblog.AssetHandler(embedPreview[0], url)
              embedPreview.find('.liveblog-embed--preview--content').empty().append(data.content)
              assetHdl.executeCommands(data.commands)
              assetHdl.loadLibraries(data.libraries)
              assetHdl.afterLoading(embedPreview[0])
            })
          }

        })
    },

  }
})(Drupal, drupalSettings, jQuery)