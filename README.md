# Project Details
## What does it do or how does it work?
The Zooml project is a web-based lunar explorer that allows users to view and interact with detailed lunar data through both 2D and 3D interfaces.
Users can explore:
- The Apollo mission landing sites, reconstructed with accurate coordinates and related geographic features.
- Geological elements such as craters, rilles, valleys, and lunar maria, represented through official datasets.
- A 3D globe view for immersive navigation and a 2D map for scientific inspection and labeling.

## What is the intended impact of the project?
The project aims to provide an enhanced and accessible experience for exploring the Moon, allowing users of all backgrounds to interact with lunar data in an intuitive and engaging way. The goal is to make lunar exploration inclusive and educational, requiring only curiosity and the desire to learn more about our natural satellite.
Additionally, this workflow and visualization approach can be extended to other celestial bodies, enabling scalable and reusable tools for planetary data visualization beyond the Moon.

## What factors did your team consider?
### Key Features
- High-resolution lunar visualization: Integration of official USGS and NASA datasets to display the Moon’s surface at large scale and high resolution (e.g., imagery with resolutions on the order of X meters per pixel).
- Historical and scientific context: Visualization of the most significant lunar events and exploration sites, including Apollo mission landing zones and their surrounding geological features.
- Interactive web experience: A structured and user-friendly web interface that allows users to navigate, search, and learn about the most relevant lunar landmarks, such as Apollo landing sites, craters, mountains, and maria.

## What makes your project creative or innovative?
The innovation lies in connecting Apollo's historical data with modern visualization techniques, transforming static lunar maps into a living, explorable digital environment. The project also emphasizes data accessibility and reuse, promoting open science by leveraging public datasets and converting them into interactive, easy-to-use formats on the web.

## How did we do it?
### Data processing
The official geometries (WKT) were extracted from the United States Geological Survey (USGS) website corresponding to the entities defined in the Keyhole Markup Language (KML) file, which contains geographic information structured using tags. These geometries were used to generate files in GeoJSON format, a widely used standard for representing spatial data, ready for visualization and analysis.
The graph shows the processing flow of a KML file, from the loading and extraction of metadata from each Placemark, to the obtaining of geometries (WKT or center point) and their conversion to GeoJSON, ending with the creation of a collection of Features ready for analysis or visualization.

### Example with the Mare Tranquillitatis area
Take the MOON_nomenclature_center_pts.kml file and convert it to Mare_Tranquillitatis_Polygon.geojson, following the process described in the flowchart.

## Why we select this data?
### Apollo 11
#### Reason for selection
Apollo 11 marked the first manned moon landing in history (July 20, 1969). Its site, Mare Tranquillitatis, was chosen for its relatively flat and safe surface for descent. It represents the beginning of direct human exploration of the Moon and the most important historical landmark in the entire space race.
#### Representative areas
- Mare Tranquillitatis: “Sea of Tranquility,” a vast basaltic plain formed by ancient volcanic eruptions. It was selected for its geological stability.
- Mount Marilyn: A small elevation informally named by Jim Lovell in honor of his wife, visible during the lunar module's approach.
- Statio Tranquillitatis: The exact landing site of the Eagle module, where Neil Armstrong uttered “one small step for man.”
- West Crater: A nearby crater that served as a visual reference during the landing.
#### Sources
- [NASA Apollo 11 Mission Overview](https://www.nasa.gov/mission/apollo-11/)
- [USGS Gazetteer (Mare Tranquillitatis)](https://planetarynames.wr.usgs.gov/Feature/3691)

### Apollo 14
#### Reason for selection
The Apollo 14 mission (1971) was designed to complete the scientific objectives that Apollo 13 was unable to achieve. Its landing site, the Fra Mauro formation, is a geologically significant site containing material ejected from the impact that formed the Mare Imbrium. It represents a key point in the geological history of the Moon.
#### Representative areas
- Fra Mauro and subcraters (A, B, C, J, Z): A series of craters that are part of the Fra Mauro plateau, characterized by its rugged terrain and scientific value for understanding the history of the Imbrium impact.
- Mare Imbrium: One of the largest lunar seas, created by a colossal impact more than 3 billion years ago.
#### Sources
- [NASA Apollo 14 Mission Summary](https://www.nasa.gov/mission/apollo-14/)
- [USGS Gazetteer (Fra Mauro)](https://planetarynames.wr.usgs.gov/Feature/2007)

### Apollo 15
#### Reason for selection
Apollo 15 (1971) was the first “J” type mission, with greater scientific capacity, duration, and use of the lunar rover (LRV). Its landing site, near Rima Hadley, combines mountainous features and deep valleys, providing a natural laboratory for studying lunar tectonics and volcanic history.
#### Representative areas
- Mons Hadley and Mons Hadley Delta: Mountains of the Apenninus massif that rise more than 4,000 m above the plain, providing a spectacular view and valuable information about the lunar crust.
- Rima Hadley: A winding channel possibly formed by lava, extensively studied by astronauts Scott and Irwin.
- Terrace: Geological area where key samples were collected to understand the formation of lunar valleys.
#### Sources
- [NASA Apollo 15 Mission Overview](https://www.nasa.gov/mission/apollo-15/)
- [USGS Gazetteer (Mons Hadley)](https://planetarynames.wr.usgs.gov/Feature/3983)

### Apollo 16
#### Reason for selection
Apollo 16 (1972) was the first mission to land in the lunar highlands, with the aim of studying ancient rocks representing the Moon's primitive crust. This site marked a shift toward more ambitious geological objectives.
#### Representative areas
- Descartes: Region of high, rugged terrain, representative of the original crust.
- Plum: Crater explored by the astronauts, famous for sample 60015, one of the most studied rocks of the mission.
- Smoky Mountains: Mountainous formation visible from the landing site, which aided in orientation and study of the local topography.
#### Sources
- [NASA Apollo 16 Mission Overview](https://www.nasa.gov/mission/apollo-16/)
- [USGS Gazetteer (Descartes)](https://planetarynames.wr.usgs.gov/Feature/1498)

### Apollo 17
#### Reason for selection
Apollo 17 (1972) was the last manned mission to the Moon. Its site, the Taurus-Littrow Valley, was chosen for its geological diversity: a mixture of ancient material from the Taurus Mountains and recent volcanic deposits. The mission combined science with history by including the first geologist astronaut, Harrison Schmitt.
#### Representative areas
- Bear Mountain: Prominent elevation north of the valley.
- Littrow and Rimae Littrow: System of volcanic channels formed by lava, which helped to understand the Moon's late volcanic activity.
- Taurus Mountains: Mountain range bordering the valley and giving the site its name.
- Shakespeare: Nearby crater used as a geological reference point.
- Taurus-Littrow Valley: Landing site and location where orange soil samples, evidence of volcanic activity, were collected.
#### Sources
- [NASA Apollo 17 Mission Overview](https://www.nasa.gov/mission/apollo-17/)
- [USGS Gazetteer (Taurus-Littrow Valley)](https://planetarynames.wr.usgs.gov/Feature/5881)

## Data Sources
### NASA Data
- [Featured Sites - Lunar Reconnaissance Orbiter Camera](https://lroc.im-ldi.com/featured_sites)
- [Image Search - Lunar Reconnaissance Orbiter Camera](https://data.lroc.im-ldi.com/lroc/search)
- [WAC Global Morphologic Map - Lunar Reconnaissance Orbiter Camera](https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_GLOBAL)

### Space Agency Partner & Other Data
- [Gazetteer of Planetary Nomenclature](https://planetarynames.wr.usgs.gov/GIS_Downloads)
- USGS Planetary Nomenclature main site: https://planetarynames.wr.usgs.gov
- Search results (Moon): https://planetarynames.wr.usgs.gov/SearchResults?Target=16_Moon
- GIS Downloads (KML/Shapefiles): https://planetarynames.wr.usgs.gov/GIS_Downloads
- Example: Mons Mare Tranquillitatis page (contains WKT): https://planetarynames.wr.usgs.gov/Feature/3691

## Use of Artificial Intelligence (AI)
All of the tools listed below were used as a guide or support to develop the demo:
- Google Gemini
- ChatGPT
- Cursor
- Claude

## Technical Implementation
To achieve this, CesiumJS libraries were implemented with React, integrating NASA's Trek API, which made it possible to generate a spherical map of the Moon capable of showing the polygons of the exact locations of the Apollo missions and other important geological features such as craters, valleys, rilles, and lunar maria. However, the image quality provided by this initial API was not sufficient for detailed visualization. After researching existing NASA implementations, eight additional APIs were identified at: https://wms1.im-ldi.com/lunaserv.html.  These APIs allow for higher resolution and quality images to be rendered, enabling a significantly improved visualization experience for the Apollo missions and other geographic data of the Moon. We combined all the versions we found at.

To render Apollo missions in some posts on https://lroc.im-ldi.com , based on that, we now have two views, one of the moon in spherical form, and another of the specific Apollo mission with maximum visual quality. We managed to have both views on a single page. Here is the comparison.

Obtaining a totally radical difference while also having a general context of how the moon looks. When it is located at the following point.

When we are on the Home page, we have the possibility to interact with Visit Landing Sites, which is the view where we can explore the landing areas of each Apollo mission and visualize the landing sites in ultra-high resolution, using the previously explained implementation that combines 8 NASA services for rendering, integrated with the OpenLayers library.

We also have a Moon Tour, where we define a route of ten interesting points on the Moon that users can explore interactively.

Finally, there is Moon Data, where the lunar datasets are presented individually so they can be explored in a detailed and independent way.
