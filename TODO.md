# TODO

- ça marche moyennement bien la gomme qui efface tout qui est censée remettre le calque en mode full
- UI carrée comme à l'époque VB6

- après les refactos :
  - vérifier le responsive
  - vérifier le PWA sur Android
- il faudrait ptet un bouton pour prendre toute la surface disponible à côté du bouton fit (à voir quand on aura d'autres actions à intégrer)

## Refacto mode composite

- un peu chiant de jongler entre le composite et les masques, y'a pas moyen de faire plus intuitif ?

## Refacto espace de travail

- ajouter une sorte de layer spécial tout en haut de la pile avec comme titre "Espace de travail" et comme miniature le rendu composite
- bouger 7 boutons de la toolbar vers ce nouvel élément (zoom, déplacement, composite et sauvegarde)
- ajouter un slider pour chaque paramètre de type luminosité/contraste (se baser sur ce qui est dans Snapseed)
- réduire toutes les calques sauf celui courant
- les layers réduits n'ont qu'une miniature, un titre, l'oeil et la suppression

## Refacto positionnement

- comment gérer différemment le positionnement ? l'idée serait d'avoir un positionnement en action par défaut et de devoir explicitement choisir le pinceau ou la gomme ensuite

## Refacto historique

- il faut penser à vider indexeddb à la main
- détails :
  - historique/persistence ISO
  - format : [{ key: timestamp, value: metadata }]
  - suppression du plafond sur le nombre d'actions
  - restauration au lancement en rejouant tous les states de la persistence
  - le pointeur de l'historique référence le timestamp
  - si nouvelle action après un undo, alors on supprime le futur puis on crée la nouvelle action et on met à jour le pointeur
  - on ne snapshot l'image qu'une seule fois, lors du load
  - la suppression d'un calque supprime tous les évènements d'historique liés à ce calque, aisni que dans la persistence
  - si tous les calques sont supprimés alors supprime tous les évènements globaux de l'historique
  - les masques sont enregistrés par diff rectangulaire
- data :
  - { event: 'add_layer', layer_id: <layer_id>, image: ImageBitmap, width: number, height: number }
  - { event: 'layer_visibility', layer_id: <layer_id>, visible: boolean }
  - { event: 'layer_blend_mode', layer_id: <layer_id>, mode: string }
  - { event: 'layer_blend_opacity', layer_id: <layer_id>, opacity: number }
  - { event: 'layer_scale', layer_id: <layer_id>, scale: number }
  - { event: 'layer_fit', layer_id: <layer_id> }
  - { event: 'layer_move', layer_id: <layer_id>, x: number, y: number }
  - { event: 'layer_recenter', layer_id: <layer_id> }
  - { event: 'mask_draw', rect: { x, y, w, h }, data: ImageData }
  - { event: 'mask_invert', layer_id: <layer_id> }
  - { event: 'mask_clear', layer_id: <layer_id> }
  - { event: 'workspace_mask_feather_size', size: number }
  - { event: 'workspace_mask_feather_edge_clamp', enabled: boolean }
  - { event: 'workspace_scale', scale: number }
  - { event: 'workspace_fit'  }
  - { event: 'workspace_move' , x: number, y: number }
  - { event: 'workspace_recenter' }
  - { event: 'workspace_snap', enabled: boolean }
  - { event: 'workspace_composite_mode', enabled: boolean }
  - <layer_id> : hash aléatoire de 6 caractères hexadécimaux
