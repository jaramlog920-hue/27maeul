import {SHARED_BACKGROUND_DRAFT_IDS,isSharedBackgroundStory,sharedBackgroundDraftPeople,drawSharedBackgroundDraft} from './shared-background-draft-art'
import {storyLocationContext as sharedDefaultLocation} from './story-location-context'
import type {StoryLocationContext} from './story-location-context'
import {NEIGHBOR_ARRIVAL_IDS,isNeighborArrival,neighborArrivalPeople,drawNeighborArrival} from './neighbor-arrival-art'
import {BAKERY_DINNER_IDS,isBakeryDinner,drawBakeryDinner} from './bakery-dinner-art'
import {FAMILY_ROOM_REMAINDER_IDS,isFamilyRoomRemainder,familyRoomRemainderPeople,drawFamilyRoomRemainder} from './family-room-remainder-art'
import {HOME_YARD_EVENT_IDS,isHomeYardEvent,homeYardEventPeople,drawHomeYardEvent} from './home-yard-events-art'
import type {HomeYardEventContext} from './home-yard-event-context'
import {SHOP_REMAINDER_IDS,isShopRemainder,shopRemainderPeople,drawShopRemainder} from './shop-remainder-art'
import {TRAVEL_EVENT_IDS,isTravelEvent,travelEventPeople,drawTravelEvent} from './travel-events-art'
import {LIBRARY_EVENT_IDS,isLibraryEvent,libraryEventPeople,drawLibraryEvent} from './library-events-art'
import {POSTMAN_EVENT_IDS,isPostmanEvent,postmanEventPeople,drawPostmanEvent} from './postman-events-art'
import {HILL_EVENT_IDS,isHillEvent,hillEventPeople,drawHillEvent} from './hill-events-art'
import {HALL_EVENT_IDS,isHallEvent,hallEventPeople,drawHallEvent} from './hall-events-art'
import {SQUARE_EVENT_IDS,isSquareEvent,squareEventPeople,drawSquareEvent} from './square-events-art'
import {SHEEP_EVENT_IDS,isSheepEvent,sheepEventPeople,drawSheepEvent} from './sheep-events-art'
import {VINE_EVENT_IDS,isVineEvent,vineEventPeople,drawVineEvent} from './vine-events-art'
import {OIL_EVENT_IDS,isOilEvent,oilEventPeople,drawOilEvent} from './oil-events-art'
import {WOOD_EVENT_IDS,isWoodEvent,woodEventPeople,drawWoodEvent} from './wood-events-art'
import {HERB_EVENT_IDS,isHerbEvent,herbEventPeople,drawHerbEvent} from './herb-events-art'
import {BEE_EVENT_IDS,isBeeEvent,beeEventPeople,drawBeeEvent} from './bee-events-art'
import {drawShoreEvent,SHORE_EVENT_IDS,isShoreEvent,shoreEventPeople} from './shore-events-art'
import {drawWeaverEvent,WEAVER_EVENT_IDS,isWeaverEvent,weaverEventPeople} from './weaver-events-art'
import {drawSmithEvent,SMITH_EVENT_IDS,isSmithEvent,smithEventPeople} from './smith-events-art'
import {drawTeaEvent,TEA_EVENT_IDS,isTeaEvent,teaEventPeople} from './tea-events-art'
import {drawBakeryEvent,BAKERY_EVENT_IDS,isBakeryEvent,bakeryEventPeople} from './bakery-events-art'
import {drawBakeryFrontBackground} from './bakery-front-background'
import {drawHomeFamily,HOME_ROOM_IDS,isHomeRoom,isHomeRoomKid,isHomeRoomActivity,HOME_ROOM_MEAL_IDS} from './home-family-art'
import {drawPenelopeProposal} from './penelope-proposal-art'
import {drawWendellProposal} from './wendell-proposal-art'
import {drawTillyProposal} from './tilly-proposal-art'
import {drawCosmoProposal} from './cosmo-proposal-art'
import {drawJuniperProposal} from './juniper-proposal-art'
import {drawPoppyProposal} from './poppy-proposal-art'
import {drawPresserProposal} from './presser-proposal-art'
import {drawMerchantProposal} from './merchant-proposal-art'
import {drawBasilProposal} from './basil-proposal-art'
import {drawMarigoldProposal} from './marigold-proposal-art'
import {drawPostmanProposal} from './postman-proposal-art'
import {drawRudyProposal} from './rudy-proposal-art'
import {drawDexterProposal,type ProposalArtContext} from './dexter-proposal-art'
import {drawPenelopeWedding} from './penelope-wedding-art'
import {drawWendellWedding} from './wendell-wedding-art'
import {drawTillyWedding} from './tilly-wedding-art'
import {drawCosmoWedding} from './cosmo-wedding-art'
import {drawJuniperWedding} from './juniper-wedding-art'
import {drawPoppyWedding} from './poppy-wedding-art'
import {drawPresserWedding} from './presser-wedding-art'
import {drawMerchantWedding} from './merchant-wedding-art'
import {drawBasilWedding} from './basil-wedding-art'
import {drawMarigoldWedding} from './marigold-wedding-art'
import {drawPostmanWedding} from './postman-wedding-art'
import {drawRudyWedding} from './rudy-wedding-art'
import {drawDexterWedding} from './dexter-wedding-art'
import {drawChildBorn} from './child-born-art'
import {drawSiblingBorn} from './sibling-born-art'
import {drawExpectingBaby} from './expecting-baby-art'
import {drawObservationPage} from './observation-page-art'
import {drawPenelopeWovenBook} from './penelope-woven-book-art'
import {drawPenelopeCoverOffer} from './penelope-cover-offer-art'
import {drawOneThread} from './one-thread-art'
import {drawPenelopeFirstCloth} from './penelope-first-cloth-art'
import {drawShownToOne} from './shown-to-one-art'
import {drawPoppyFireMemory} from './poppy-fire-memory-art'
import {drawPoppyBreadWish} from './poppy-bread-wish-art'
import {drawMerchantPrivateBox} from './merchant-private-box-art'
import {drawLastCopiedPage} from './last-copied-page-art'
import {drawOneMoreBook} from './one-more-book-art'
import {drawOurBlend} from './our-blend-art'
import {drawCountingSteps} from './counting-steps-art'
import {drawWorriedApothecary} from './worried-apothecary-art'
import {drawReversedName} from './reversed-name-art'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawTimedGathering,timedGathering,TIMED_GATHERINGS,type TimedGathering} from './timed-gathering-art'
import {drawSharedCushion} from './shared-cushion-art'
import {drawFamilyReading} from './family-reading-art'
import {drawBeeNotebook} from './bee-notebook-art'
import {drawRiverRest} from './river-rest-art'
import {drawForkSign} from './fork-sign-art'
import {drawReedRackBuilt} from './reed-rack-built-art'
import {drawSnacksAndCups} from './snacks-and-cups-art'
import {drawSnackBasket} from './snack-basket-art'
import {drawSharedChair} from './shared-chair-art'
import {drawFamilyTrip} from './family-trip-art'
import {drawLightShoes} from './light-shoes-art'
import {drawOvenSharing} from './oven-sharing-art'
import {person} from './milestone-moments-art'

/** 개별 대사와 대조해 완성한 장면만 등록한다. 공통 그림을 완성 장면으로 취급하지 않는다. */
const BASE_AUTHORED_STORY_IDS=[...NEIGHBOR_ARRIVAL_IDS,...BAKERY_DINNER_IDS,...FAMILY_ROOM_REMAINDER_IDS,...HOME_YARD_EVENT_IDS,...SHOP_REMAINDER_IDS,...TRAVEL_EVENT_IDS,...LIBRARY_EVENT_IDS,...POSTMAN_EVENT_IDS,...HILL_EVENT_IDS,...HALL_EVENT_IDS,...SQUARE_EVENT_IDS,...SHEEP_EVENT_IDS,...VINE_EVENT_IDS,...OIL_EVENT_IDS,...WOOD_EVENT_IDS,...HERB_EVENT_IDS,...BEE_EVENT_IDS,...SHORE_EVENT_IDS,...WEAVER_EVENT_IDS,...SMITH_EVENT_IDS,...TEA_EVENT_IDS,...BAKERY_EVENT_IDS,...HOME_ROOM_IDS,'ev:beekeeper:story:4','romance2:penelope','romance2:penelope:friend','ev:penelope:unpickTalk','romance1:penelope','ev:juniper:story:2','romance1:wendell','romance2:wendell','ev:merchant:story:1','bookBound','shelved','ev:poppy:love:1','ev:wendell:home:2','ev:baker:story:3','lightShoes','fam:trip','ev:carpenter:story:3','ev:baker:small:festBasket','ev:poppy:story:2','built:reedRack','ev:rudy:small:signPost','village:3','ev:beekeeper:story:1','ev:penelope:lunch','fam:read','ev:rudy:love:1','ev:basil:worry','ev:presser:love:1','pregnancy','siblingBorn','childBorn','wedding:dexter','wedding:rudy','wedding:postman','wedding:marigold','wedding:basil','wedding:merchant','wedding:presser','wedding:poppy','wedding:juniper','wedding:cosmo','wedding:tilly','wedding:wendell','wedding:penelope','propose:dexter','propose:rudy','propose:postman','propose:marigold','propose:basil','propose:merchant','propose:presser','propose:poppy','propose:juniper','propose:cosmo','propose:tilly','propose:wendell','propose:penelope',...Object.keys(TIMED_GATHERINGS)] as const
export const AUTHORED_STORY_IDS=[...BASE_AUTHORED_STORY_IDS,...SHARED_BACKGROUND_DRAFT_IDS] as const
export function hasAuthoredStory(id:string){return (AUTHORED_STORY_IDS as readonly string[]).includes(id)}

export function authoredStoryPeople(id:string):string[]{if(isSharedBackgroundStory(id))return sharedBackgroundDraftPeople(id);if(isNeighborArrival(id))return neighborArrivalPeople(id);if(isBakeryDinner(id))return ['baker'];if(isFamilyRoomRemainder(id))return familyRoomRemainderPeople(id);if(isHomeYardEvent(id))return homeYardEventPeople(id);if(isShopRemainder(id))return shopRemainderPeople(id);if(isTravelEvent(id))return travelEventPeople(id);if(isLibraryEvent(id))return libraryEventPeople(id);if(isPostmanEvent(id))return postmanEventPeople(id);if(isHillEvent(id))return hillEventPeople(id);if(isHallEvent(id))return hallEventPeople(id);if(isSquareEvent(id))return squareEventPeople(id);if(isSheepEvent(id))return sheepEventPeople(id);if(isVineEvent(id))return vineEventPeople(id);if(isOilEvent(id))return oilEventPeople(id);if(isWoodEvent(id))return woodEventPeople(id);if(isHerbEvent(id))return herbEventPeople(id);if(isBeeEvent(id))return beeEventPeople(id);if(isShoreEvent(id))return shoreEventPeople(id);if(isWeaverEvent(id))return weaverEventPeople(id);if(isSmithEvent(id))return smithEventPeople(id);if(isTeaEvent(id))return teaEventPeople(id);if(isBakeryEvent(id))return bakeryEventPeople(id);if(isHomeRoom(id))return isHomeRoomActivity(id)?[id.split(':')[2]]:isHomeRoomKid(id)?['child']:(HOME_ROOM_MEAL_IDS as readonly string[]).includes(id)?['wendell']:[];return id==='propose:penelope'?['penelope']:id==='propose:wendell'?['wendell']:id==='propose:tilly'?['tilly']:id==='propose:cosmo'?['cosmo']:id==='propose:juniper'?['juniper']:id==='propose:poppy'?['poppy']:id==='propose:presser'?['presser']:id==='propose:merchant'?['merchant']:id==='propose:basil'?['basil']:id==='propose:marigold'?['marigold']:id==='propose:postman'?['postman']:id==='propose:rudy'?['rudy']:id==='propose:dexter'?['dexter']:id==='wedding:penelope'?["penelope","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","tilly","juniper","poppy"]:id==='wedding:wendell'?["wendell","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","cosmo","rudy","dexter","basil","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:tilly'?["tilly","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","penelope","juniper","poppy"]:id==='wedding:cosmo'?["cosmo","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","rudy","dexter","basil","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:juniper'?["juniper","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","penelope","tilly","poppy"]:id==='wedding:poppy'?["poppy","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","penelope","tilly","juniper"]:id==='wedding:presser'?["presser","baker","child","grandpa","merchant","smith","shepherd","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:merchant'?["merchant","baker","child","grandpa","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:basil'?["basil","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:marigold'?["marigold","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","penelope","tilly","juniper","poppy"]:id==='wedding:postman'?["postman","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","apothecary","fisher","carpenter","wendell","cosmo","rudy","dexter","basil","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:rudy'?["rudy","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","dexter","basil","marigold","penelope","tilly","juniper","poppy"]:id==='wedding:dexter'?["dexter","baker","child","grandpa","merchant","smith","shepherd","presser","weaver","beekeeper","postman","apothecary","fisher","carpenter","wendell","cosmo","rudy","basil","marigold","penelope","tilly","juniper","poppy"]:timedGathering(id)?.people??(id==='ev:beekeeper:story:4'?['beekeeper','juniper','poppy']:id==='ev:penelope:unpickTalk'?['penelope']:id==='romance1:penelope'||id==='romance2:penelope'||id==='romance2:penelope:friend'?['penelope']:id==='ev:juniper:story:2'?['juniper']:id==='romance1:wendell'||id==='romance2:wendell'?['wendell']:id==='ev:merchant:story:1'?['merchant']:id==='ev:poppy:love:1'?['poppy']:id==='ev:presser:love:1'?['presser']:id==='ev:basil:worry'?['basil']:id==='ev:rudy:love:1'?['rudy']:id==='ev:penelope:lunch'?['penelope']:id==='ev:beekeeper:story:1'?['beekeeper']:id==='village:3'?['grandpa','fisher','baker']:id==='ev:rudy:small:signPost'?['rudy','postman']:id==='built:reedRack'?['carpenter']:id==='ev:poppy:story:2'?['poppy','wendell']:id==='ev:baker:small:festBasket'?['baker']:id==='ev:carpenter:story:3'?['carpenter','rudy','smith']:id==='ev:baker:story:3'?['baker','wendell']:id==='lightShoes'?['shepherd']:[])}

export function drawAuthoredStory(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[]=[],beat=0,choice?:number|null,context?:ProposalArtContext,familyFind?:string,workItem?:string,yardContext?:HomeYardEventContext,_location?:StoryLocationContext){
 if(isSharedBackgroundStory(id)){drawSharedBackgroundDraft(g,id,w,h,t,avatar,npc,beat,_location??sharedDefaultLocation(),id==='done:baker:2'?others[0]??null:null);return}
 if(!hasAuthoredStory(id))return
 if(isNeighborArrival(id)){drawNeighborArrival(g,id,w,h,t,avatar,npc,beat);return}
 if(isBakeryDinner(id)){drawBakeryDinner(g,w,h,t,avatar,npc,others,beat);return}
 if(isFamilyRoomRemainder(id)){drawFamilyRoomRemainder(g,id,w,h,t,avatar,npc,beat);return}
 if(isHomeYardEvent(id)){drawHomeYardEvent(g,id,w,h,t,avatar,npc,beat,yardContext);return}
 if(isShopRemainder(id)){drawShopRemainder(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isTravelEvent(id)){drawTravelEvent(g,id,w,h,t,avatar,npc,others,beat);return}
 if(isLibraryEvent(id)){drawLibraryEvent(g,id,w,h,t,avatar,npc,others,beat,choice,workItem);return}
 if(isPostmanEvent(id)){drawPostmanEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isHillEvent(id)){drawHillEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isHallEvent(id)){drawHallEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isSquareEvent(id)){drawSquareEvent(g,id,w,h,t,avatar,npc,others,beat,choice,familyFind);return}
 if(isSheepEvent(id)){drawSheepEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isVineEvent(id)){drawVineEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isOilEvent(id)){drawOilEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isWoodEvent(id)){drawWoodEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isHerbEvent(id)){drawHerbEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isBeeEvent(id)){drawBeeEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isShoreEvent(id)){drawShoreEvent(g,id,w,h,t,avatar,npc,beat,choice,others);return}
 if(isWeaverEvent(id)){drawWeaverEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isSmithEvent(id)){drawSmithEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isTeaEvent(id)){drawTeaEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isBakeryEvent(id)){drawBakeryEvent(g,id,w,h,t,avatar,npc,others,beat,choice);return}
 if(isHomeRoom(id)){drawHomeFamily(g,id,w,h,t,avatar,npc,others,beat,choice??0,context);return}
 if(id==='propose:cosmo'){drawCosmoProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:tilly'){drawTillyProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:wendell'){drawWendellProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:penelope'){drawPenelopeProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:juniper'){drawJuniperProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:poppy'){drawPoppyProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:presser'){drawPresserProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:merchant'){drawMerchantProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:basil'){drawBasilProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:marigold'){drawMarigoldProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:postman'){drawPostmanProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:rudy'){drawRudyProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='propose:dexter'){drawDexterProposal(g,w,h,t,avatar,npc,beat,context);return}
 if(id==='wedding:penelope'){drawPenelopeWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:wendell'){drawWendellWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:tilly'){drawTillyWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:cosmo'){drawCosmoWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:juniper'){drawJuniperWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:poppy'){drawPoppyWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:presser'){drawPresserWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:merchant'){drawMerchantWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:basil'){drawBasilWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:marigold'){drawMarigoldWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:postman'){drawPostmanWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:rudy'){drawRudyWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='wedding:dexter'){drawDexterWedding(g,w,h,t,avatar,npc,others,beat);return}
 if(id==='childBorn'){drawChildBorn(g,w,h,t,avatar,npc,others[0]??npc,beat);return}
 if(id==='siblingBorn'){drawSiblingBorn(g,w,h,t,avatar,npc,others[0]??npc,others[1]??npc,beat);return}
 if(id==='pregnancy'){drawExpectingBaby(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:beekeeper:story:4'){drawObservationPage(g,w,h,t,avatar,npc,others[0]??npc,others[1]??npc,beat,choice);return}
 if(id==='ev:penelope:unpickTalk'){drawOneThread(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:juniper:story:2'){drawShownToOne(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:poppy:love:1'){drawOurBlend(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='bookBound'){drawLastCopiedPage(g,w,h,t,avatar);return}
 if(id==='shelved'){drawOneMoreBook(g,w,h,t,avatar);return}
 g.imageSmoothingEnabled=false
 if(id==='romance2:penelope'){drawPenelopeWovenBook(g,w,h,t,avatar,npc,beat);return}
 if(id==='romance2:penelope:friend'){drawPenelopeCoverOffer(g,w,h,t,avatar,npc,beat);return}
 if(id==='romance1:penelope'){drawPenelopeFirstCloth(g,w,h,t,avatar,npc,beat);return}
 if(id==='romance1:wendell'){drawPoppyFireMemory(g,w,h,t,avatar,npc,beat);return}
 if(id==='romance2:wendell'){drawPoppyBreadWish(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:merchant:story:1'){drawMerchantPrivateBox(g,w,h,t,avatar,npc,beat,choice);return}
 if(timedGathering(id)){drawTimedGathering(g,id as TimedGathering,w,h,t,avatar,[npc,...others],beat);return}
 if(id==='ev:penelope:lunch'){drawSharedCushion(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:beekeeper:story:1'){drawBeeNotebook(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:presser:love:1'){drawCountingSteps(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:basil:worry'){drawWorriedApothecary(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:rudy:love:1'){drawReversedName(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='fam:read'){drawFamilyReading(g,w,h,t,avatar,npc,beat);return}
 if(id==='village:3'){drawRiverRest(g,w,h,t,avatar,npc,others[0]??npc,others[1]??npc,beat);return}
 if(id==='ev:rudy:small:signPost'){drawForkSign(g,w,h,t,avatar,npc,others[0]??npc,beat,choice);return}
 if(id==='built:reedRack'){drawReedRackBuilt(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:poppy:story:2'){drawSnacksAndCups(g,w,h,t,avatar,npc,others[0]??npc,beat,choice);return}
 if(id==='ev:baker:small:festBasket'){drawSnackBasket(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:carpenter:story:3'){drawSharedChair(g,w,h,t,avatar,npc,others[0]??npc,others[1]??npc,beat);return}
 if(id==='fam:trip'){drawFamilyTrip(g,w,h,t,avatar,npc,beat);return}
 if(id==='lightShoes'){drawLightShoes(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:baker:story:3'){drawOvenSharing(g,w,h,t,avatar,npc,others[0]??npc,beat);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h*(h<=170?.65:.5))
 drawBakeryFrontBackground(p,w,h,ground)
 person(p,cx-28,ground+23,npc.avatar,'right',npc.who)
 const approach=Math.min(1,Math.max(0,t/2.5))
 person(p,cx+38-approach*24,ground+23,avatar,'left','writer',false,approach<1,t)
 // 가게 앞 공기만 움직인다. 답변으로 고른 계획을 이미 실행한 것처럼 그리지 않는다.
 const leafX=cx+69+(Math.floor(t*2)%15),leafY=ground-34+(Math.floor(t*3)%24)
 p(leafX,leafY,'#99a979',2,1)
}
