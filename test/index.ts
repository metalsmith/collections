import Metalsmith from 'metalsmith'
import collections, { ReferencesArray } from '../lib/index'

Metalsmith('.')
  .use(collections({
    services: {
      filter: () => true,
      pattern: 'services/*.md',
      refer: true,
      metadata: 'services/metadata.yml',
      sort: 'name:asc',
      limit: 25
    }
  }))
  .use(function(files, metalsmith) {
   const file = files['index.md'] as Metalsmith.File<{ collection: Record<string, ReferencesArray>}>
   file.collection.services.previous.forEach((file) => {
    file.contents
   })
   file.collection.services.next
   file.collection.services[0]
  })