# Historique des versions

> Dernière version : [0.0.9](#0.0.9)

* [0.0.9 - 21/08/2018](#0.0.9)
* [0.0.8 - 26/06/2018](#0.0.8)
* [0.0.7 - 19/06/2018](#0.0.7)
* [0.0.6 - 29/05/2018](#0.0.6)
* [0.0.5 - 19/05/2018](#0.0.5)
* [0.0.4 - 06/05/2018](#0.0.4)
* [0.0.3 - 22/07/2018](#0.0.3)
* [0.0.2 - 18/04/2018](#0.0.2)
* [0.0.1 - 16/04/2018](#0.0.1)


## 0.0.9
> Publié le 21/08/218

### Ajouts
* **Commande `!daily` :** Permet d'utiliser les pouvoirs de certains objets
* **Commande `!invite` :** Permet d'obtenir le lien pour ajouter le bot sur son serveur
* **Message d'explication lors de l'arrivée du bot dans un serveur :** Le message sera envoyé au propriétaire du serveur uniquement si les salons privés sont ouverts
* **Elements dans la console**
* **Le bot quitte les serveurs ayant un pourcentage de bot par rapport au humains trop élevé :** Evite les tentatives de triches
* **Message lorsque le classement est en train de chargé :** Pour les commandes `!top` et `!profile`
* ***Easter eggs***
    * **Deux nouveaux *easter eggs***
    * **Concours de *easter eggs* :** Objet unique à gagner
* **Altération d'état :** Mourant
* **Deux nouveaux événements :** Ajout par *`Séqui#4748`* et *`nwcubeok#6360`*

### Modifications
* **Classement**
    * **15 joueurs par page dans le top**
    * **Les joueurs avec lequels un rapport est disponible est indiqué dans la commande `!top`**
    * **Les joueurs avec lequels un rapport est en attente est indiqué dans la commande `!top`**
* **Modification du message de bienvenue :** Ajout d'un conseil et réorganisation
* **Amélioration de la commande `!aide`**
* **Augmentation des gains à la vente d'un objet :** Avec la commande `!sell`
* **Evénements**
    * **Amélioration de certains événements :** Au niveau des explications
    * **Les rapports reprennent après le temps du soin :** Non plus après la sortie de l'hôpital
* **Combat bloqué avant le niveau 10**
* **La commande `!levelup` a été complétement retravaillée**
* **Correction d'erreurs d'orthographes**

### Corrections de bugs
* **DB008-1 :** Le classement n'affiche pas le bon nombre de joueurs
* **DB008-3 :** Possibilité d'avoir plus de 100 points de vie
* **DB008-4 :** Obtenir un sac de pièces annule le gain précédent


## 0.0.8
> Publié le 26/06/2018

### Ajouts
* **Commande `!topguild` :** Permet de voir le classement du serveur sur lequel la commande a été exécutée
* **Altération d'état :** Gelée
* **Pastille de couleur dans la commande `!top` :** Pour les personnes sur le même serveur que vous
* **Un *easter egg***
* **Deux nouveaux événements :** Ajout par *`Guysmow 🐈🐱#0666`*

### Modifications
* **Réduction du cout des passages de niveau :** Avec la commande `!levelup`
* **Aspect de la commande `!regen`**
* **Emoji :broken_heart: lors de la perte de points de vie :** Au lieu de l'émoji :heart:
* **Amélioration du monologue du début :** Pour clarifier le but du jeu

### Suppressions
* **Mentions inutiles dans la commande `!regen`**

### Corrections du bugs
* **DB007-1 :** L'événement de la forêt indique une perte de 20 points de vie alors que la réalité est 40 points de vie
* **DB007-2 :** Le classement bug si la première commande d'un joueur est `!top`


## 0.0.7
> Publié le 19/06/2018

**RENITIALISATION DE L'AVANCEMENT DE TOUS LES JOUEURS**

### Ajouts
* **Niveaux**
    * **Système de niveaux de joueur**
    * **Commande `!levelup` :** Permet de monter en niveau
* **Combats**
    * **Système de combat :** Entre deux joueurs
    * **Commande `!combat` :** Permet de lancer un combat contre un autre joueur
* **Aides**
    * **Commande `!aide` :** Permet d'obtenir de l'aide sur toutes les commandes du bot
    * **Tutoriel au début du jeu :** Pour mieux guider les nouveaux joueurs
* **Altération d'état :** Confus
* **Rapports**
    * **Suppression des indices dans les rapports**
    * **Deux événements :** Ajout de *`[NKP] Makapo#0248`* et *`Gren'#4601`*
* **Quelques *easter eggs***

### Modifications
* **Corrections d'erreurs d'orthographe**
* **Les objets trouvables dans les rapports sont plus puissants pour les joueurs de haut niveau**
* **Clarification des explications :** Notamment dans les événements
* **Tag du bot :** #0099
* **Description du bot**


## 0.0.6
> Publié le 29/05/2018

### Modifications
* **L'hôpital de redonne plus de points de vie**
* **Corrections d'erreurs d'orthographe**
* **Amélioration de la commande `!help`**

### Corrections de bugs
* **DB005-1 :** L'événement de la forêt fait planter le bot


## 0.0.5
> Publié le 19/05/2018

### Ajouts
* **Commande `!inventaire` :** Permet de voir le contenu de son inventaire
* **Commande `!sell` :** Permet de vendre l'objet contenu dans la réserve
* **Commande `!switch` :** Permet d'échanger l'objet contenu dans la réserve avec celui actif de l'inventaire
* **Commande `!top` :** Permet de voir le classement de tous les joueurs
* **Commande `!help` :** Première version de l'aide pour voir les informations sur chaque commande du bot
* **Trois événements :** Ajout par *`『Axel ▪ Azn9 』#7374`* et *`Invarion#0001`*
* **Possibilité de trouver et ramasser des objets dans les rapports**

### Modifications
* **Correction d'affichage dans la commande `!regen`**

### Corrections de bugs
* **DB004-1 :** Des joueurs meurent sans raison


## 0.0.4
> Publié le 06/05/2018

### Ajouts
* **Commande `!respawn` :** Permet de recommencer après d'être mort
* **Un événement :** Ajout par *`Gren'#4601`*
* **Les différents états de guérison ne mènent pas forcément à la même durée de guérison**
* **Altération d'état :** Endormi

### Modifications
* **La commande `!regen` a été complétement revue :** Elle affiche maintenant le temps avant la fin de la guérison
* **Le temps de guérison a été maintenant fixer à sa valeur normale**
* **Le système d'événements a été amélioré :** Afin d'améliorer l'ajouts de nouveaux événéments

### Suppressions
* **Commande `!random`**
* **Commande `!banane`**
* **Commandes en messages privés**

### Corrections de bugs
* **DB003-4 :** Le joueur reste à l'hôpital lors du plantage du bot
* **DB003-5 :** Le temps du rapport n'est parfois pas rénitialisé
* **DB003-6 :** Les événements aléatoires ne sont pas lancés


## 0.0.3
> Publié le 22/07/2018

### Ajouts
* **Commande `!random` :** Permet d'avoir un nombre aléatoire entre 0 et 1
* **Maladies**
    * **Système de maladie**
    * **Commande `!regen` :** Permet de se soigner et récuperer un peu de vie
    * **Impossibilité d'avoir un rapport lorsque le joueur est malade ou en train de se faire soigner**
    * **Indication sur l'état dans la commande `!profile` :** Pour savoir si le joueur est malade ou en train se faire soigner
* **Un événement :** Ajout par *`Gren'#4601`*

### Corrections de bugs
* **DB003-1 :** La rénitialisation met le joueur malade
* **DB003-2 :** Le temps est mal calculé lorsque un événement apparait de manière aléatoire


## 0.0.2
> Publié le 18/04/2018

### Ajouts
* **Commande `!rapport` :** Permet d'avoir un rapport avec les éléments collectés pendant votre absence
* **Deux événements :** Ajout de *`Z_runner#7515`*
* **Les événements apparaissent aléatoirement :** Ils peuvent bénifiques ou maléfiques
* **Plus le temps entre deux rapports est long plus les ressources collectés sont importantes :** Cependant au bout de 10 heures plus rien n'est collecté
* **Plus le temps entre deux rapports est long plus il y a de chances qu'un événement se produise**


## 0.0.1
> Publié le 16/04/2018

### Ajouts
* **Commande `!ping` :** Permet de tester sir le bot est en ligne
* **Commande `!banane` :** Permet d'apprendre les bases de la programmation d'un bot
* **Commande `!profile` :** Permet d'afficher les informations principales du joueur
* **Commande `!reset` :** Permet de supprimer un joueur de la base de données
* **Commande `!destroy` :** Permet d'éteindre le bot
* **Commande `!purge` :** Permet de supprimer un certain nombre de message
* **Commande `!reload` :** Permet de recharger une commande
* **Système d'événements**
* **Base de données**