import { Command } from "@sapphire/framework";
import axios, { AxiosError, AxiosResponse } from 'axios';
import * as json from '../config.json'
import { Role } from "discord.js";

export class VerifyCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, { ...options, description: "Verify a User", });
  }
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder.setName("giveroles").setDescription("Assign roles for channel access");
    });
  }
  
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();
    let roles:Role[] = [];
    let config: IStringIndex = json;
    const uid = interaction.user.id;
    let res: AxiosResponse = {} as AxiosResponse;
    let data: ApiResponse;
    try {
      res = await axios.get(`https://api.vatsim.net/v2/members/discord/${uid}`);
      data = res.data;
    } catch (e) {
      let error = e as AxiosError;
      if (error.response?.status == 404) {
        await handleError(1, interaction);
      }
      return;
    }
    
    if (data.id != uid) {
      await handleError(2, interaction);
      return;
    }

    res = await axios.get(`https://api.vatusa.net/v2/user/${data.user_id}`);
    if (res.status == 404) {
      await handleError(2, interaction);
      return;
    }

    let user: User = {
      fname: res.data.data.fname,
      lname: res.data.data.lname,
      artcc: res.data.data.facility,
      rating: res.data.data.rating.toString(),
      roles: res.data.data.roles,
      visiting_facilities: res.data.data.visiting_facilities,
      isVisitor: false
    }
    
    let member = await interaction.guild?.members.fetch(uid);
    member.roles.remove(member.roles.cache);
    roles.push(await interaction.guild?.roles.fetch(config.base)) //VATSIMController for ZJX
    if (member != null) {
      //Convert VATSIM Rating Integer to String
      switch (user.rating) { 
        case "1": {
          user.rating = "OBS";
          break;
        }
        case "2": {
          user.rating = "S1";
          break;
        }
        case "3": {
          user.rating = "S2";
          break;
        }
        case "4": {
          user.rating = "S3";
          break;
        }
        case "5": {
          user.rating = "C1";
          break;
        }
        case "6": {
          //C2 - Unused for VATSIM
          break;
        }
        case "7": {
          user.rating = "C3";
          break;
        }
        case "8": {
          user.rating = "I1";
          break;
        }
        case "10": {
          user.rating = "I3";
          break;
        }
        case "11": {
          user.rating = "SUP";
          break;
        }
        case "12": {
          user.rating = "ADM";
          break;
        }
        default: {
          user.rating = "";
          break;
        }
      }
      console.log(user);
      try {
        await member.setNickname(`${user.fname} ${user.lname} | ${user.artcc}`);
        let rating = config[user.rating];
        roles.push(await interaction.guild?.roles.fetch(rating));
        if (user.artcc != "ZJX") {
          for (let i = 0; i < user.visiting_facilities.length; i++) {
            if (user.visiting_facilities[i].facility == "ZJX") {
              console.log("User is a visitor");
              console.log(config.visitor);
              console.log(await interaction.guild?.roles.fetch(config.visitor));
              roles.push(await interaction.guild?.roles.fetch(config.visitor)); //Add 'Visiting Controller' Role
              break;
            } else {
              continue;
            }
          }
          //* Edit below based on neighboring ARTCCs
          switch (user.artcc) {
            case "ZTL": {
              //roles.push(await interaction.guild?.roles.fetch('1198344104497659904'));
              break;
            }
            case "ZMA": {
              //roles.push(await interaction.guild?.roles.fetch('1198344298832351272'));
              break;
            }
            case "ZHU": {
              //roles.push(await interaction.guild?.roles.fetch('1198344426074947756'));
              break;
            }
            case "ZDC": {
              //roles.push(await interaction.guild?.roles.fetch('1198344523760271531'));
              break;
            }
            default: {
              break;
            }
          }
        } else {
          roles.push(await interaction.guild?.roles.fetch(config.member)); //Add 'ZJX Controller' role
        }
      } catch (error) {
        await handleError(0, interaction);
        console.log(`Line 115: ${error}`);
        return;
      }
    }
    console.log(user.roles.length);
    if (user.roles.length > 0) {
      for (let i = 0; i < user.roles.length; i++) {
        if (user.roles[i].facility == "ZAE") {
          break;
        } 
        if (user.roles[i].facility != "ZJX") {
          break;
        }
        //Really pointless since the role bot is not able to assign roles higher than itself
        switch(user.roles[i].role) {
          case "ATM": 
            roles.push(await interaction.guild?.roles.fetch(config.atm));
            break;
          case "DATM": 
            roles.push(await interaction.guild?.roles.fetch(config.datm));
            break;
          case "TA":
            roles.push(await interaction.guild?.roles.fetch(config.ta));
            break;
          case "FE": 
            roles.push(await interaction.guild?.roles.fetch(config.fe));
            break;
          case "EC":
            roles.push(await interaction.guild?.roles.fetch(config.ec));
            break;
          case "WM":
            roles.push(await interaction.guild?.roles.fetch(config.wm));
            break;
        }
      }
    }
    console.log(roles);
    await member.roles.add(roles); //Add all roles in the roles[] array
    await interaction.editReply("Your roles have been assigned!");
    return;
  }
}

async function handleError(error: number, interaction: Command.ChatInputCommandInteraction) {
  let errorText: string;
  
  switch (error) {
    case 0: {
      errorText = `There was an error assigning roles for ${interaction.user.username}`;
      await interaction.editReply("There was an error assigning your roles!");
      sendError(errorText, interaction);
      break;
    }
    case 1: {
      errorText = "You are not linked to a VATSIM account! Please link your account at https://community.vatsim.net/ then try again!"
      await interaction.editReply(errorText);
      break;
    }
    case 2: {
      errorText = "You were not found in the VATUSA database! You have been issued the pilot role"
      await interaction.editReply(errorText);
      break;
    }
    case 3: {
      errorText = "Something went wrong, please try again!"
      await interaction.editReply(errorText);
      await sendError("Some error occured while verifying a user", interaction);
      break;
    }
  }
  return;
}

async function sendError(errorText: string, interaction: Command.ChatInputCommandInteraction) {
  let errorDate = new Date();
  let config: IStringIndex = json;
  let errorStamp = errorDate.toLocaleDateString() + " " + errorDate.toLocaleTimeString();
  console.log(errorText);
  const message = `${errorStamp} Zulu: ${errorText}`
  await interaction.editReply(errorText + " \n**The developers have been notified of this error.**")
  for (let i = 0; i < config.notified_users.length; i++) {
    let user = await interaction.client.users.fetch(config.notified_users[i]);
    user.send(message);
  }
  return;
}

interface ApiResponse {
  id: string;
  user_id: string;
}

interface User {
  fname: string;
  lname: string;
  artcc: string;
  rating: string;
  roles: [
    {
      id: number;
      cid: number;
      facility: string;
      role: string;
      created_at: string;
    }
  ]
  visiting_facilities: [
    {
      id: number;
      cid: number;
      facility: string;
      created_at: string;
      updated_at: string;
    }
  ],
  isVisitor: boolean;
}

interface IStringIndex {
  [key: string]: any;
}