import type { SitePageSlug } from './routes';
import type { SitePageCopy } from './types';

export const frenchSitePages: Record<SitePageSlug, SitePageCopy> = {
    about: {
        title: 'À propos de Fuse Bead Patterns',
        description: 'Découvrez Fuse Bead Patterns, un outil gratuit dans le navigateur pour transformer photos et pixel art en modèles de perles à repasser imprimables.',
        heading: 'À propos',
        intro: 'Bienvenue sur Fuse Bead Patterns, un outil gratuit dans le navigateur qui transforme photos, sprites et illustrations simples en modèles Perler imprimables. Notre objectif est simple : vous permettre de prévisualiser, ajuster, retoucher et exporter un modèle avant de commencer à poser les perles.',
        sections: [
            { heading: 'Pourquoi nous avons créé cet outil', highlighted: true, paragraphs: [
                'Fuse Bead Patterns réunit la conversion d’images, la retouche de chaque perle et les exports imprimables dans un seul outil accessible dans le navigateur. Vous pouvez préparer la grille et les couleurs avant de poser les perles, et les images que vous ouvrez restent sur votre appareil.',
            ] },
            { heading: 'Nos principes', bullets: [
                { label: 'Gratuit et accessible :', text: 'Aucun frais caché, aucun abonnement. Ouvrez le générateur et commencez un modèle.' },
                { label: 'Respect de la vie privée :', text: 'Les images sont traitées localement dans votre navigateur. Nous ne voyons pas vos photos, ne les stockons pas et ne les envoyons pas sur un serveur.' },
                { label: 'Maîtrise de votre création :', text: 'Ajustez la taille des plaques, les couleurs, les retouches et les exports en fonction du projet que vous souhaitez réaliser.' },
            ] },
            { heading: 'Comment les modèles de la bibliothèque sont préparés', paragraphs: [
                'Les modèles nommés d’après un jeu partent d’une référence documentée pour le personnage, l’objet et la version représentés. Nous vérifions la grille de pixels d’origine, conservons les cases occupées et les zones de couleur, puis associons les couleurs à la palette numérique Perler Midi. Les pages des modèles conservent les liens de référence et les précisions sur la version. Les créations originales sont indiquées séparément.',
                { before: 'Chaque modèle comprend un aperçu, une grille, une liste de couleurs de perles et un projet modifiable. Les dimensions du motif décrivent le dessin ; celles des plaques incluent les cases vides qui l’entourent. Les téléchargements standard utilisent Perler Midi. Vous pouvez ', href: '/fr/guides/perler-to-hama-artkal', label: 'passer aux couleurs Hama ou Artkal dans l’éditeur', after: ' et exporter votre propre version.' },
            ] },
            { heading: 'Ce qui a été vérifié', paragraphs: [
                'Nos vérifications portent sur l’identité de la référence, les dimensions de la grille, le nombre de couleurs et la cohérence entre les grilles à télécharger et les projets. Les modèles n’ont pas été assemblés avec de vraies perles ni testés au repassage. Les couleurs à l’écran sont approximatives, et les jonctions fines ou les pièces séparées peuvent nécessiter un soutien supplémentaire. Lisez les conseils de réalisation de chaque modèle avant de commencer.',
                { before: 'Vous avez repéré une différence ou rencontré un problème pendant la réalisation ? Écrivez à ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: ' en précisant le lien du modèle, la marque de perles et le détail à vérifier.' },
            ] },
        ],
        cta: { heading: 'Prêt à créer ?', label: 'Créer un modèle' },
    },
    'privacy-policy': {
        title: 'Politique de confidentialité',
        description: 'Politique de confidentialité de Fuse Bead Patterns : traitement local des images, statistiques d’utilisation, cookies et contact.',
        heading: 'Politique de confidentialité', updated: '17 avril 2026',
        intro: 'Chez Fuse Bead Patterns (« nous », « notre » ou « nos »), le respect de votre vie privée fait partie intégrante du produit. Nous avons conçu notre générateur de modèles de perles à repasser pour que le traitement des images s’effectue localement dans votre navigateur.',
        sections: [
            { heading: '1. Traitement local des images', paragraphs: ['Nous n’envoyons pas vos images sur un serveur. Lorsque vous sélectionnez une photo à convertir en modèle de perles à repasser, l’ensemble du traitement s’effectue localement dans votre navigateur web à l’aide de JavaScript. Vos images ne sont jamais transmises à nos serveurs et nous n’y avons pas accès.'] },
            { heading: '2. Collecte de données', paragraphs: [
                'Nous ne vous demandons pas de créer un compte et nous ne collectons pas de données permettant de vous identifier, telles que votre nom, votre adresse e-mail ou votre localisation, pour utiliser les fonctions principales de création de modèles.',
                'Nous utilisons Google Analytics pour comprendre des tendances d’utilisation anonymes et agrégées, telles que les pages consultées, le type d’appareil, le type de navigateur et les interactions générales. Ces informations nous aident à améliorer le générateur et l’éditeur. Nous n’utilisons pas ces statistiques pour examiner les images que vous ouvrez, et leur traitement reste local dans votre navigateur.',
            ] },
            { heading: '3. Cookies', paragraphs: ['Notre site peut utiliser des cookies fonctionnels courants ou le stockage local strictement nécessaires pour mémoriser les préférences de l’éditeur, comme le zoom, les paramètres de la grille, les palettes choisies ou les données d’un brouillon. Google Analytics peut utiliser des cookies ou des technologies similaires à des fins de mesure. Nous n’utilisons pas de cookies de suivi tiers pour la publicité ciblée.'] },
            { heading: '4. Liens vers des sites tiers', paragraphs: ['Notre site peut contenir des liens vers des sites tiers, par exemple des ressources de fournitures créatives ou des références externes. Nous ne sommes pas responsables des pratiques de confidentialité ni du contenu de ces sites.'] },
            { heading: '5. Nous contacter', paragraphs: [{ before: 'Pour toute question ou préoccupation concernant cette politique de confidentialité, contactez-nous à : ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: '.' }] },
        ],
    },
    'terms-of-service': {
        title: 'Conditions d’utilisation',
        description: 'Conditions d’utilisation de Fuse Bead Patterns et de son générateur de modèles de perles à repasser dans le navigateur.',
        heading: 'Conditions d’utilisation', updated: '17 avril 2026',
        intro: 'Bienvenue sur Fuse Bead Patterns. En accédant à notre site (fusebeadpatterns.art) et à nos services, ou en les utilisant, vous acceptez d’être lié par les présentes conditions d’utilisation.',
        sections: [
            { heading: '1. Utilisation du service', paragraphs: ['Fuse Bead Patterns propose un outil gratuit dans le navigateur pour convertir des images en modèles de perles à repasser imprimables. Vous pouvez utiliser notre service pour des activités créatives personnelles, éducatives ou commerciales.'] },
            { heading: '2. Propriété intellectuelle et droits d’auteur', paragraphs: [
                'Vos contenus : vous conservez tous les droits et la propriété des images que vous ouvrez et traitez avec notre outil. Le traitement ayant lieu localement dans votre navigateur, nous ne stockons ni ne distribuons vos images ou les modèles générés et nous n’en revendiquons pas la propriété.',
                'Respect des droits d’auteur : vous vous engagez à ne pas utiliser notre outil pour créer des modèles à partir d’images protégées ou d’autres éléments de propriété intellectuelle que vous n’avez pas le droit d’utiliser, de reproduire ou de distribuer. Nous ne sommes pas responsables des atteintes aux droits d’auteur résultant de votre utilisation des modèles générés.',
            ] },
            { heading: '3. Absence de garantie', paragraphs: ['Le service est fourni « en l’état » et « selon sa disponibilité », sans garantie d’aucune sorte, expresse ou implicite. Nous ne garantissons pas que les modèles générés répondront parfaitement à vos attentes, ni que l’accès au site sera ininterrompu ou exempt d’erreurs.'] },
            { heading: '4. Limitation de responsabilité', paragraphs: ['Fuse Bead Patterns et ses créateurs ne pourront en aucun cas être tenus responsables de dommages directs, indirects, accessoires, particuliers ou consécutifs découlant de votre utilisation du service ou des modèles générés, ou liés de quelque manière que ce soit à cette utilisation.'] },
            { heading: '5. Modification des conditions', paragraphs: ['Nous nous réservons le droit de modifier les présentes conditions à tout moment. La date de la dernière mise à jour figure en haut de cette page. En continuant à utiliser le site, vous acceptez les conditions mises à jour.'] },
            { heading: '6. Contact', paragraphs: [{ before: 'Pour toute question concernant ces conditions, contactez-nous à : ', href: 'mailto:contact@fusebeadpatterns.art', label: 'contact@fusebeadpatterns.art', after: '.' }] },
        ],
    },
};
