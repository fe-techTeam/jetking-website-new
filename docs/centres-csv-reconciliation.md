# Centre reconciliation: legacy branch CSV vs site centres

Sources: `branch.csv` (124 rows), joined to `cities.csv` and `states.csv` by city id; site centres from `src/lib/content/fixtures/locations.ts` (39). Matching is by normalised name (the words "Jetking", "Learning Centre" and punctuation removed), so near-misses need a human eye. Nothing was imported.

## Summary

| Bucket | Count |
|---|---|
| CSV branch matches a site centre | 31 |
| CSV only (real-looking branches not on the site) | 80 |
| CSV test / dummy / HO / non-centre entries | 13 |
| Site centre with no CSV match | 8 |

The CSV has no address, phone, pincode or email, so a CSV-only branch cannot be published from this data alone. The meaning of the 3rd column ("Flag": 0/1/2/3) is not documented; it is shown as-is. 14 branches have a city id that is missing from `cities.csv`.

## Matched (31)

| CSV id | CSV name | Code | Site slug |
|---|---|---|---|
| 1 | Jetking Laxminagar Learning Centre | DE | laxminagar |
| 3 | Jetking Vikas Puri Learning Center | VP | vikaspuri |
| 5 | Jetking Prayagraj Learning Centre | AB | allahabad |
| 9 | Jetking Bhopal Learning Center | BL | bhopal |
| 10 | Jetking Gurgaon Learning Centre | GG | gurgaon |
| 11 | Jetking Chandigarh Learning Centre | CH | chandigarh |
| 15 | Jetking Swargate Learning Center | PP | swargate |
| 20 | Jetking Maninagar Learning Center | MN | maninagar |
| 21 | Jetking Shivajinagar Learning Center | SN | shivajinagar |
| 23 | Jetking Rajajinagar Learning Centre | RJ | rajajinagar |
| 24 | Jetking Dhanbad Learning Center | DB | dhanbad |
| 25 | Jetking Bhawanipore Learning Centre | KK | bhawanipore |
| 27 | Jetking Bhubaneshwar Learning Centre | BU | bhubaneshwar |
| 30 | Jetking Kochi Learning Centre | KO | kochi |
| 32 | Jetking Lucknow-Station Road Learning Centre | LK | lucknow-station-road |
| 37 | Jetking Kukatpally Learning Center | KY | kukatpally |
| 43 | Jetking Jammu Learning Center | JU | jammu |
| 48 | Jetking Nagpur Mahal Learning Center | NM | nagpurmahal |
| 51 | Jetking Noida Learning Centre | ND | noida |
| 52 | Jetking Borivali Learning Centre | BO | borivali |
| 54 | Jetking Thane learning Centre | TW | thane |
| 56 | Jetking Durg Learning Center | DU | durg |
| 57 | Jetking Balasore Learning Center | BS | balasore |
| 59 | Jetking Azadpur Learning Center | AZ | azadpur |
| 76 | Jetking Dadar Learning Centre | DA | dadar |
| 90 | Jetking Gwalior Learning Centre | GW | gwalior |
| 180 | Jetking Mohali Learning Centre | ML | mohali |
| 181 | Jetking Wardha Learning Centre | WD | wardha |
| 182 | Jetking Orai Learning Centre | OR | orai |
| 183 | Jetking Indore Learning Centre | IND | indore |
| 187 | Jetking Khar Learning Centre | KH | khar-mumbai |

## Site centres with no CSV match (8)

Likely renamed in the legacy system (e.g. "New …" variants); check these against the CSV-only list.

| Slug | Name | City |
|---|---|---|
| ameerpet | Jetking Ameerpet | hyderabad |
| gorakhpur | Jetking Gorakhpur | gorakhpur |
| kanpur | Jetking Kanpur | kanpur |
| south-extension | Jetking South Extension | delhi |
| varanasi | Jetking Varanasi | varanasi |
| vashi | Jetking Vashi | mumbai |
| vasai | Jetking Vasai | mumbai |
| wakad-chinchwad | Jetking Wakad / Chinchwad | pune |

## CSV only (80)

| CSV id | Branch | Code | City | State | Flag |
|---|---|---|---|---|---|
| 35 | Ho chi Minh | HA | — | — | 1 |
| 47 | Hanoi | AA | — | — | 1 |
| 50 | Kathmandu | NP | — | — | 0 |
| 61 | HCM Binh Thanh | BT | — | — | 0 |
| 157 | Danang | DV | — | — | 0 |
| 167 | CG Road | CG | — | — | 0 |
| 169 | Nepal Kathmandu (Balaju) | NE | — | — | 0 |
| 170 | Agra new | UA | — | — | 0 |
| 174 | New Jayanagar | JYN | — | — | 0 |
| 185 | Da Nang | JDN | — | — | 1 |
| 186 | Can Tho | JCT | — | — | 1 |
| 153 | Tirupati | TI | Tirupati | Andhra Pradesh | 0 |
| 160 | Motihari | MH | East Champaran | Bihar | 0 |
| 26 | Patna | PA | Patna | Bihar | 0 |
| 31 | Kankarbagh | PK | Patna | Bihar | 0 |
| 16 | Raipur | RP | Raipur | Chhattisgarh | 0 |
| 178 | New Raipur | RC | Raipur | Chhattisgarh | 0 |
| 2 | Rohini | RO | Delhi | Delhi | 0 |
| 33 | Karol Bagh | KB | Delhi | Delhi | 0 |
| 63 | New South Ex | SX | Delhi | Delhi | 1 |
| 148 | Dwarka | DW | Delhi | Delhi | 0 |
| 19 | Goa(Panjim) | PJ | Panaji | Goa | 0 |
| 70 | C G Road | CG | Ahmedabad | Gujarat | 0 |
| 79 | Vasna | GV | Ahmedabad | Gujarat | 0 |
| 88 | Naranpura | NU | Ahmedabad | Gujarat | 0 |
| 73 | New Bharuch | BC | Bhachau | Gujarat | 0 |
| 78 | Porbandar | PO | Porbandar | Gujarat | 0 |
| 44 | Surat | SU | Surat | Gujarat | 0 |
| 155 | New Surat | SA | Surat | Gujarat | 0 |
| 64 | Bahadurgarh | BG | Bahadurgarh | Haryana | 0 |
| 8 | Faridabad | FB | Faridabad | Haryana | 2 |
| 77 | Cybercity Gurgaon | GU | Gurgaon | Haryana | 0 |
| 150 | Shimla | SH | Shimla | Himachal Pradesh | 0 |
| 149 | Sadashivnagar | SD | Banglore | Karnataka | 0 |
| 83 | New Belgaum | BM | Belgaum | Karnataka | 0 |
| 75 | Bellary | LL | Bellary | Karnataka | 0 |
| 22 | Jayanagar | JN | Bengaluru | Karnataka | 0 |
| 29 | Marathalli | MR | Bengaluru | Karnataka | 0 |
| 86 | Banashankari | BK | Bengaluru | Karnataka | 0 |
| 74 | Trivandrum | TV | Trivandrum | Kerala | 0 |
| 154 | Bhopal MP Nagar | BP | Bhopal | Madhya Pradesh | 1 |
| 6 | New Indore | ID | Indore | Madhya Pradesh | 0 |
| 60 | Jabalpur New | JP | Jabalpur | Madhya Pradesh | 0 |
| 147 | Aurangabad | AC | Aurangabad | Maharashtra | 0 |
| 18 | Kolhapur | KL | Kolhapur | Maharashtra | 0 |
| 12 | Sewri | SW | Mumbai | Maharashtra | 0 |
| 13 | Vasai Road | VS | Mumbai | Maharashtra | 1 |
| 151 | Andheri East | AE | Mumbai | Maharashtra | 0 |
| 161 | Kalyan | KN | Mumbai | Maharashtra | 0 |
| 176 | New Dadar | DD | Mumbai | Maharashtra | 1 |
| 17 | Nagpur | NG | Nagpur | Maharashtra | 0 |
| 55 | Nashik | NK | Nashik | Maharashtra | 0 |
| 58 | New Vashi | VH | Navi Mumbai | Maharashtra | 1 |
| 67 | New Vashi | VH | Navi Mumbai | Maharashtra | 3 |
| 36 | Hadapsar | HD | Pune | Maharashtra | 0 |
| 66 | Wakad | WK | Pune | Maharashtra | 1 |
| 72 | New JM Road | JR | Pune | Maharashtra | 0 |
| 82 | Dimapur | DN | Dimapur | Nagaland | 0 |
| 68 | Amritsar | AM | Amritsar | Punjab | 0 |
| 81 | Gopalpura | GJ | Jaipur | Rajasthan | 0 |
| 40 | Secunderabad | SB | Hyderabad | Telangana | 0 |
| 42 | Dilsukhnagar | DR | Hyderabad | Telangana | 0 |
| 46 | ECIL | EC | Hyderabad | Telangana | 0 |
| 80 | Chandanagar | TC | Hyderabad | Telangana | 0 |
| 84 | Agartala | AR | Agartala | Tripura | 0 |
| 152 | Agra | AG | Agra | Uttar Pradesh | 0 |
| 4 | Bareilly | BY | Bareilly | Uttar Pradesh | 0 |
| 62 | old Ghaziabad | GH | Ghaziabad | Uttar Pradesh | 0 |
| 179 | Ghaziabad | GHZ | Ghaziabad | Uttar Pradesh | 1 |
| 7 | Gorakhpur II | GK | Gorakhpur | Uttar Pradesh | 0 |
| 184 | New Gorakhpur | GRP | Gorakhpur | Uttar Pradesh | 1 |
| 34 | New Kanpur | KR | Kanpur | Uttar Pradesh | 1 |
| 14 | Lucknow-Indiranagar | LW | Lucknow | Uttar Pradesh | 0 |
| 65 | Lucknow-Aliganj | LA | Lucknow | Uttar Pradesh | 0 |
| 39 | Meerut | ME | Meerut | Uttar Pradesh | 0 |
| 173 | New Noida | NJ | Noida | Uttar Pradesh | 1 |
| 71 | Varanasi new | VA | Varanasi | Uttar Pradesh | 1 |
| 69 | Gariahat | GR | Kolkata | West Bengal | 0 |
| 87 | Bidhannagar | BB | Kolkata | West Bengal | 0 |
| 28 | Siliguri | SL | Siliguri | West Bengal | 0 |

## Test / dummy / non-centre entries (13)

| CSV id | Branch | Code | City | State | Flag |
|---|---|---|---|---|---|
| 41 | Ameerpeth | AP | Hyderabad | Telangana | 0 |
| 156 | Skillking (Brand of ) | SK | Mumbai | Maharashtra | 0 |
| 159 | Online Training | ON | Mumbai | Maharashtra | 0 |
| 162 | Infini | KKI | Ambernath | Maharashtra | 0 |
| 163 | Virtual | VC | Mumbai | Maharashtra | 0 |
| 164 | INFOTRAIN LTD | CSR | Mumbai | Maharashtra | 1 |
| 165 | INFOTRAIN LIMITED - HO | HO | Mumbai | Maharashtra | 0 |
| 166 | MTU | - | — | — | 0 |
| 168 | ERP  LMS TEST | Test | Mumbai | Maharashtra | 1 |
| 171 | Test 25 nov | TEST25 | — | — | 0 |
| 172 | New Ameerpeth | AH | Hyderabad | Telangana | 1 |
| 175 | App Registration  - Dummy | APP | Mumbai | Maharashtra | 0 |
| 177 | Testing | undefined | — | — | 0 |

---

## Addendum: `branch (1).csv` (same 124 branches, adds address and moves the code last)

Columns are `id, name, flag, address, city_id, code`. Ids, names, flags, codes and city ids are identical to `branch.csv`; the only new data is a free-text `address` (no phone, email or structured pincode; 86 of 124 contain a 6-digit pincode, 2 contain a phone number).

**Flag 1 looks like "active".** 28 of the 31 CSV branches that match a site centre have flag 1; the other 3 (Bhopal, Noida, Dadar) have flag 0. Overall: 76 branches flag 0, 46 flag 1, one flag 2 (Faridabad), one flag 3 (New Vashi, id 67). This is inferred from the data, not documented, so confirm it with whoever owns the legacy system.

**Active (flag 1) branches that are not on the site**

| CSV id | Branch | City, state | Pincode in address | Probably the same as site centre |
|---|---|---|---|---|
| 13 | Vasai Road | Mumbai, Maharashtra | none | Vasai |
| 34 | New Kanpur | Kanpur, Uttar Pradesh | none | Kanpur |
| 58 | New Vashi | Navi Mumbai, Maharashtra | 400703 | Vashi |
| 63 | New South Ex | Delhi | 110049 | South Extension |
| 66 | Wakad | Pune, Maharashtra | 411019 | Wakad / Chinchwad |
| 71 | Varanasi new | Varanasi, Uttar Pradesh | none | Varanasi |
| 184 | New Gorakhpur | Gorakhpur, Uttar Pradesh | 273001 | Gorakhpur |
| 154 | Bhopal MP Nagar | Bhopal, Madhya Pradesh | 462023 | none (site Bhopal is the inactive flag-0 branch) |
| 173 | New Noida | Noida, Uttar Pradesh | none | none (site Noida is the inactive flag-0 branch) |
| 176 | New Dadar | Mumbai, Maharashtra | 400028 | none (site Dadar is the inactive flag-0 branch) |
| 179 | Ghaziabad | Ghaziabad, Uttar Pradesh | 201002 | none |
| 35, 47, 185, 186 | Ho Chi Minh, Hanoi, Da Nang, Can Tho | city id not in `cities.csv` (Vietnam) | none | none |

So the 8 "site centres with no CSV match" are mostly legacy renames ("New …"), not missing branches. The site's Ameerpet is the one without a visible counterpart: the CSV has "Ameerpeth" (inactive) and "New Ameerpeth" (active), a spelling difference.

**Worth a human decision**

- Site centres that the CSV marks inactive (flag 0): Bhopal, Noida, Dadar. Their active replacements are New Noida, Bhopal MP Nagar, New Dadar.
- Pincode disagreements with the site: Bhopal (CSV 462011, site 462001) and Shivajinagar (CSV 560001, site 560051).
- Genuinely new active branches: Ghaziabad, plus the four Vietnam centres if the site should list them.
- 31 of the 111 non-test branches have no pincode in the address, and none has a phone, so addresses can fill gaps but not replace the site's contact data.

**Decision (India-only site):** only active (flag 1) Indian branches are shown on the site. Ghaziabad was added; the four Vietnam branches (Ho Chi Minh, Hanoi, Da Nang, Can Tho) are deliberately not on the site. Bhopal, Noida and Dadar already carry their active branches' addresses, so they needed no change.
