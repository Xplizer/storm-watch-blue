# Denmark StormWatch Demo

## Goal
Transform the current storm tracker into a Denmark-focused school demonstration while preserving its blue, mobile-first design and core tracker/map interactions.

## Changes
- Replace the US hurricane feed shown in the app with a Denmark dataset containing clearly sourced real historical storms and a stable set of fictional demonstration storms.
- Include upcoming, active, and passed examples across Lillebælt, Aarhus, Aalborg, Esbjerg, Odense, Copenhagen, Western Jutland/North Sea, and Zealand.
- Adapt storm terminology and severity bands to Danish wind conditions, displaying wind in m/s as the primary unit.
- Recenter and frame the map around Denmark. Draw all storm paths and affected-area circles with one consistent visual style.
- Update the storm details panel with status, Danish location, arrival/passed time, direction, and affected areas.
- Keep storm tracking and open-app proximity alerts.
- Remove the Journal link, page, hook, and stored journal functionality entirely.
- Update page titles/descriptions to describe the Denmark school-project demo.

## Data integrity
- Real entries will only contain conservative facts supported by reliable sources; unavailable values will remain unspecified rather than invented.
- Fictional and real entries will use the same presentation, without individual provenance labels.
- One project-wide disclaimer will state that some storms are fictional and the app is not an official warning service.

## Validation
- Check the project for remaining Journal or US/NOAA-facing copy.
- Verify the tracker and map at mobile and desktop sizes, including map selection and storm details.
- Confirm the preview builds without errors.
