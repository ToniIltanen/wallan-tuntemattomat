import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
export default function Home() {
  return (
   <Box sx={{ flexGrow: 12 }}>
      <Grid container spacing={2}>
        <Grid item size={12}>
            <Image style={{margin: "0 auto", paddingTop: "100px"}} src="./logo.jpg" alt="Wallan Tuntemattomat Logo" width={"320"} height={"449"}/>
        </Grid>
        <Grid item size={12}>
          <Box style={{textAlign: "center"}}>
            Ota yhteyttä: <a style={{color: 'magenta'}} href="mailto:wallantuntemattomat@gmail.com" target="_blank" >wallantuntemattomat@gmail.com</a><br/>
            <a style={{color: 'magenta'}} target="_blank" href="https://buukkaa-bandi.fi/fi/band/wallan-tuntemattomat">Lisätietoa ja keikat</a><br/>
            Löydät meidät myös <a target="_blank" style={{color: 'magenta'}} href="https://www.facebook.com/WallanTuntemattomat">facebookista</a><br/>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
