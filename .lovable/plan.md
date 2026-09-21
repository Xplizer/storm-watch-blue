# Denmark StormWatch Demo

## Goal
Transform the current storm tracker into a Denmark-focused school demonstration while preserving its blue, mobile-first design and core tracker/map interactions.

## Changes
- Replace the US hurricane feed shown in the app with a Denmark dataset containing clearly sourced real historical storms and a stable set of fictional demonstration storms.
- Include upcoming, active, and passed examples across Lillebælt, Aarhus, Aalborg, Esbjerg, Odense, Copenhagen, Western Jutland/North Sea, and Zealand.
- Add explicit data provenance to every storm: **REAL DATA** or **FICTIONAL / DEMO**. Place a persistent project-demo notice on both tracker and map screens.
- Adapt storm terminology and severity bands to Danish wind conditions, displaying wind in m/s as the primary unit.
- Recenter and frame the map around Denmark. Draw storm paths and affected-area circles, with solid styling for real data and clearly differentiated dashed styling for fictional data.
- Update the storm details panel with status, Danish location, arrival/passed time, direction, affected areas, data source, and an unambiguous warning that fictional entries are not official warnings.
- Keep storm tracking and open-app proximity alerts, but ensure alerts for demo events say they are simulations.
- Remove the Journal link, page, hook, and stored journal functionality entirely.
- Update page titles/descriptions to describe the Denmark school-project demo.

## Data integrity
- Real entries will only contain conservative facts supported by reliable sources; unavailable values will remain unspecified rather than invented.
- Fictional entries will be defined locally and always carry a demo marker in lists, markers, details, and alerts.
- The screen will state that the app is not an official warning service.

## Validation
- Check the project for remaining Journal or US/NOAA-facing copy.
- Verify the tracker and map at mobile and desktop sizes, including map selection and storm details.
- Confirm the preview builds without errors.
