UPDATE "brands"
SET "logo" = CASE "slug"
  WHEN 'b-braun' THEN '/images/brands/b-braun.svg'
  WHEN 'bpl-medical' THEN '/images/brands/bpl-medical.png'
  WHEN 'canon-medical' THEN '/images/brands/canon-medical.svg'
  WHEN 'contec' THEN '/images/brands/contec.jpg'
  WHEN 'draeger' THEN '/images/brands/draeger.webp'
  WHEN 'edan' THEN '/images/brands/edan.png'
  WHEN 'erbe' THEN '/images/brands/erbe.png'
  WHEN 'fresenius' THEN '/images/brands/fresenius.svg'
  WHEN 'fukuda-denshi' THEN '/images/brands/fukuda-denshi.svg'
  WHEN 'ge-healthcare' THEN '/images/brands/ge-healthcare.svg'
  WHEN 'getinge' THEN '/images/brands/getinge.svg'
  WHEN 'hamilton-medical' THEN '/images/brands/hamilton-medical.svg'
  WHEN 'hitachi' THEN '/images/brands/hitachi.png'
  WHEN 'karl-storz' THEN '/images/brands/karl-storz.webp'
  WHEN 'medtronic' THEN '/images/brands/medtronic.svg'
  WHEN 'mindray' THEN '/images/brands/mindray.png'
  WHEN 'nihon-kohden' THEN '/images/brands/nihon-kohden.png'
  WHEN 'olympus' THEN '/images/brands/olympus.svg'
  WHEN 'philips' THEN '/images/brands/philips.svg'
  WHEN 'riester' THEN '/images/brands/riester.png'
  WHEN 'roche-diagnostics' THEN '/images/brands/roche-diagnostics.png'
  WHEN 'samsung-medison' THEN '/images/brands/samsung-medison.png'
  WHEN 'schiller' THEN '/images/brands/schiller.svg'
  WHEN 'siemens-healthineers' THEN '/images/brands/siemens-healthineers.svg'
  WHEN 'smiths-medical' THEN '/images/brands/smiths-medical.png'
  WHEN 'spacelabs' THEN '/images/brands/spacelabs.png'
  WHEN 'stryker' THEN '/images/brands/stryker.svg'
  WHEN 'sysmex' THEN '/images/brands/sysmex.svg'
  WHEN 'welch-allyn' THEN '/images/brands/welch-allyn.svg'
  WHEN 'altonika' THEN '/images/brands/altonika.jpg'
  WHEN 'elatma' THEN '/images/brands/elatma.svg'
  WHEN 'kazmedpribor' THEN '/images/brands/kazmedpribor.jpg'
  WHEN 'ramenskoe-pribor' THEN '/images/brands/ramenskoe-pribor.webp'
  WHEN 'triton-electronics' THEN '/images/brands/triton-electronics.png'
  WHEN 'uomz' THEN '/images/brands/uomz.png'
  ELSE "logo"
END
WHERE "slug" IN (
  'b-braun', 'bpl-medical', 'canon-medical', 'contec', 'draeger', 'edan',
  'erbe', 'fresenius', 'fukuda-denshi', 'ge-healthcare', 'getinge',
  'hamilton-medical', 'hitachi', 'karl-storz', 'medtronic', 'mindray',
  'nihon-kohden', 'olympus', 'philips', 'riester', 'roche-diagnostics',
  'samsung-medison', 'schiller', 'siemens-healthineers', 'smiths-medical',
  'spacelabs', 'stryker', 'sysmex', 'welch-allyn', 'altonika', 'elatma',
  'kazmedpribor', 'ramenskoe-pribor', 'triton-electronics', 'uomz'
);
